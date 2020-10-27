/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

import getLookupOptions from "@salesforce/apex/SoundboardUtilities.getLookupOptions";

import labels from "./labels";

const DELAY = 300;

const KEYS = {
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  ENTER: 13,
  ESCAPE: 27
};

export default class Lookup extends LightningElement {
  label = labels;

  static delegatesFocus = true;

  @api skipYourself;

  _filterList;
  selectedOption;
  showOptions;
  searchOptions;
  hasFocus;
  searchTerm;
  searching;
  timer;
  activeOption;

  connectedCallback() {
    this.searchOptions = [];
    this.searchTerm = "";
    this.searching = false;
  }

  @api
  get filterList() {
    return this._filterList;
  }

  set filterList(users) {
    this._filterList = users.map(el => el.dcstuff__User__r.Id);
  }

  get lookupLabel() {
    return this.filterList
      ? this.label.Lookup_label_user
      : this.label.Lookup_label_user_or_group;
  }

  get showOptionsClass() {
    return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${
      this.showOptions && this.searchOptions.length > 0 ? "slds-is-open" : ""
    }`;
  }

  get ariaExpandedShowOptionsClass() {
    return this.showOptions && this.searchOptions.length > 0;
  }

  get noSelectedOptionClass() {
    return `slds-input slds-combobox__input slds-combobox__input-value ${
      this.hasFocus ? "slds-has-focus" : ""
    }`;
  }

  get searchSpinnerClass() {
    return `slds-spinner slds-spinner_brand slds-spinner_x-small slds-input__spinner${
      this.searching ? "" : " slds-hide"
    }`;
  }

  get clearButtonClass() {
    return `slds-button slds-button_icon slds-input__icon slds-input__icon_right${
      this.searchTerm ? "" : " slds-hide"
    }`;
  }

  handleOnFocus() {
    this.showOptions = true;
    this.hasFocus = true;
    this.template
      .querySelector(".listbox")
      .addEventListener("mousedown", this.listenForMousedown);
  }

  handleInput(event) {
    this.searchTerm = event.target.value;
    window.clearTimeout(this.timer);

    if (!this.searchTerm || this.searchTerm.length < 3) {
      this.timer = null;
      this.searchOptions = [];
      this.activeOption = "";
      this.showOptions = true;

      return;
    }

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.timer = setTimeout(() => {
      this.fireLookupSearch();
    }, DELAY);
  }

  handleOnBlur() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      const lookupContainer = this.template.querySelector(".lookup-container");

      if (!lookupContainer.contains(document.activeElement)) {
        this.showOptions = false;
        this.hasFocus = false;
        this.removeActiveDescendant();

        this.template
          .querySelector(".listbox")
          .removeEventListener("mousedown", this.listenForMousedown);
      }
    });
  }

  handleKeyDown(event) {
    const upPressed = event.keyCode === KEYS.UP_ARROW;
    const downPressed = event.keyCode === KEYS.DOWN_ARROW;
    const enterPressed = event.keyCode === KEYS.ENTER;
    const escapePressed = event.keyCode === KEYS.ESCAPE;

    const activeOptionIdx = this.searchOptions.reduce((acc, cur, idx) => {
      return cur.value === this.activeOption ? idx : acc;
    }, null);
    const lastPossibleIdx = this.searchOptions.length - 1;
    const firstOption = this.searchOptions[0];
    const lastOption = this.searchOptions[lastPossibleIdx];
    const noActiveOption = activeOptionIdx === null;
    const firstOptionActive = activeOptionIdx === 0;
    const lastOptionActive = activeOptionIdx === lastPossibleIdx;
    let nextActiveOption;

    if (upPressed) {
      // required else pressing the "up" arrow will move the cursor to the start
      // of the input field
      event.preventDefault();
    }

    if (
      (upPressed || downPressed) &&
      (!this.searchOptions || !this.searchOptions.length)
    ) {
      // nothing to see, don't try to update the nextActiveOption or it will gack
      return;
    }

    if (!escapePressed && !this.showOptions) {
      this.showOptions = true;
    }

    if (upPressed && noActiveOption) {
      nextActiveOption = lastOption.value;
    } else if (downPressed && noActiveOption) {
      nextActiveOption = this.searchOptions[0].value;
    } else if (upPressed && firstOptionActive) {
      nextActiveOption = lastOption.value;
      const optionsList = this.template.querySelector(".slds-listbox");
      const optionsListBottom = optionsList.getBoundingClientRect().bottom;
      this.updateDropdownScrollTop(optionsListBottom);
    } else if (downPressed && lastOptionActive) {
      nextActiveOption = firstOption.value;
      this.updateDropdownScrollTop(0);
    } else if (upPressed) {
      nextActiveOption = this.searchOptions[activeOptionIdx - 1].value;
    } else if (downPressed) {
      nextActiveOption = this.searchOptions[activeOptionIdx + 1].value;
    } else if (enterPressed) {
      this.selectOption();
    } else if (escapePressed) {
      this.timer = null;
      this.searchOptions = [];
      this.showOptions = false;
      this.activeOption = "";
      this.removeActiveDescendant();
    }

    if (nextActiveOption) {
      this.activeOption = nextActiveOption;
      this.updateActiveDescendant();
      this.updateContainerScrollIfNeeded(nextActiveOption);
    }
  }

  async fireLookupSearch() {
    this.searchOptions = [];
    this.searching = true;
    try {
      const tempOptions = await getLookupOptions({
        searchTerm: this.searchTerm,
        searchGroups: !this.filterList,
        skipYourself: this.skipYourself
      });

      if (this.filterList && this.filterList.length) {
        this.searchOptions = tempOptions.filter(
          el => !this.filterList.includes(el.value)
        );
      } else {
        this.searchOptions = tempOptions;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      this.searching = false;
    }
  }

  listenForMousedown(e) {
    // don't trigger blur if scrollbar receives mousedown event
    e.preventDefault();
  }

  updateContainerScrollIfNeeded(val) {
    const optionsListClass = ".slds-listbox";
    const containerClass = ".listbox";

    if (
      !this.template.querySelector(optionsListClass) ||
      !this.template.querySelector(containerClass)
    ) {
      return;
    }

    const container = this.template.querySelector(containerClass);
    const containerBounds = container.getBoundingClientRect();
    const containerTop = containerBounds.top;
    const containerBottom = containerBounds.bottom;

    const queryForActiveOption = `[data-option="${val}"]`;
    const optionsList = this.template.querySelector(optionsListClass);
    const activeOption = optionsList.querySelector(queryForActiveOption);
    if (!activeOption) {
      return;
    }
    const activeOptionBounds = activeOption.getBoundingClientRect();
    const activeOptionTop = activeOptionBounds.top;
    const activeOptionBottom = activeOptionBounds.bottom;
    const activeOptionHeight = activeOptionBounds.height;

    const optionBelowFieldOfView = containerBottom < activeOptionBottom;
    const optionAboveFieldOfView = containerTop > activeOptionTop;

    if (optionBelowFieldOfView) {
      const updatedScrollTop = container.scrollTop + activeOptionHeight;
      this.updateDropdownScrollTop(updatedScrollTop);
    } else if (optionAboveFieldOfView) {
      const updatedScrollTop = container.scrollTop - activeOptionHeight;
      this.updateDropdownScrollTop(updatedScrollTop);
    }
  }

  updateDropdownScrollTop(updatedTop) {
    const container = this.template.querySelector(".listbox");
    if (!container) {
      return;
    }

    container.scrollTop = updatedTop;
  }

  handleOptionSelect(event) {
    this.handleOptionActivate(event);
    this.selectOption();
  }

  handleOptionActivate(event) {
    this.activeOption = event.detail;
    this.updateActiveDescendant();
  }

  updateActiveDescendant() {
    const el = this.template.querySelector(
      `[data-option="${this.activeOption}"]`
    );
    if (el && el.id) {
      this.template
        .querySelector("input")
        .setAttribute("aria-activedescendant", el.id);
    }
  }

  removeActiveDescendant() {
    this.template
      .querySelector("input")
      .setAttribute("aria-activedescendant", "");
  }

  selectOption() {
    if (this.activeOption) {
      const onlyMatchingOptions = this.searchOptions.filter(
        option => option.value === this.activeOption
      );
      this.selectedOption = onlyMatchingOptions[0];
      this.searchOptions = [];
      this.showOptions = false;
      this.searchTerm = "";
      this.fireLookupOptionSelected();
    }
  }

  fireLookupOptionSelected() {
    this.dispatchEvent(
      new CustomEvent("optionselect", {
        detail: this.selectedOption
      })
    );
  }

  handleClearInput() {
    this.searchTerm = "";
    this.searchOptions = [];
    const input = this.template.querySelector(".slds-input");
    if (input) {
      input.focus();
    }
  }
}

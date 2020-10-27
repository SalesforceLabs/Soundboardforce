/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

import labels from "./labels";

const KEYS = {
  ENTER: 13
};

export default class Group extends LightningElement {
  label = labels;

  static delegatesFocus = true;

  @api groups;

  isAddingGroup = false;
  newName = "";

  renderedCallback() {
    if (this.isAddingGroup) {
      this.template.querySelector(".newName").focus();
    }
  }

  get isNewNameInvalid() {
    return this.newName.trim().length === 0;
  }

  handleAddGroupVisible() {
    this.isAddingGroup = !this.isAddingGroup;
  }

  handleKeyUp(event) {
    this.newName = event.target.value;
    if (event.keyCode === KEYS.ENTER && !this.isNewNameInvalid) {
      this.handleGroupAdd();
    }
  }

  handleGroupAdd() {
    this.dispatchEvent(
      new CustomEvent("groupadd", { detail: this.newName.trim() })
    );
    this.newName = "";
  }

  handleGroupDelete(event) {
    this.dispatchEvent(
      new CustomEvent("groupdelete", { detail: event.detail })
    );
  }

  handleMemberAdd(event) {
    this.dispatchEvent(new CustomEvent("memberadd", { detail: event.detail }));
  }

  handleMemberDelete(event) {
    this.dispatchEvent(
      new CustomEvent("memberdelete", {
        detail: event.detail
      })
    );
  }
}

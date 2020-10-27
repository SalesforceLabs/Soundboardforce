/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Lookup from "c/Lookup";

import getLookupOptions from "@salesforce/apex/SoundboardUtilities.getLookupOptions";

jest.mock(
  "@salesforce/label/c.Input_placeholder",
  () => ({ default: "Search..." }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SoundboardUtilities.getLookupOptions",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const KEYS = {
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  ENTER: 13,
  ESCAPE: 27
};

const OPTIONS = [
  { value: "opt1", fullName: "opt1" },
  { value: "opt2", fullName: "opt2" },
  { value: "opt3", fullName: "opt3" }
];

describe("c-lookup", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }

    // Prevent data saved on mocks from leaking between tests
    jest.clearAllMocks();
  });

  // Helper function to wait until the microtask queue is empty. This is needed
  // for promise timing when calling imperative Apex.
  function flushPromises() {
    // eslint-disable-next-line no-undef
    return new Promise(resolve => setImmediate(resolve));
  }

  it("should be a-ok with no selection", () => {
    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [];
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("input");
    expect(inputEl.placeholder).toBe("Search...");
  });

  it("searches for nuthin on input of fewer than 3 characters", () => {
    jest.useFakeTimers();

    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [];
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("input");
    inputEl.value = "ba";
    inputEl.dispatchEvent(new Event("input"));

    jest.runAllTimers();

    expect(setTimeout).not.toHaveBeenCalled();
  });

  it("searches for options on input of 3 or more characters", async () => {
    jest.useFakeTimers();
    getLookupOptions.mockResolvedValue(OPTIONS);

    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [];
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("input");
    inputEl.focus();
    inputEl.value = "baddabing";
    inputEl.dispatchEvent(new Event("input"));

    jest.runAllTimers();
    await flushPromises();

    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 300);
    expect(getLookupOptions).toHaveBeenCalled();

    const lookupOptions = element.shadowRoot.querySelectorAll(
      "c-lookup-option"
    );
    expect(lookupOptions.length).toBe(3);
  });

  it("searches for options with user in filterList", async () => {
    jest.useFakeTimers();
    getLookupOptions.mockResolvedValue(OPTIONS);

    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [{ dcstuff__User__r: { Id: "opt2" } }];
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("input");
    inputEl.value = "baddabing";
    inputEl.dispatchEvent(new Event("input"));

    jest.runAllTimers();
    await flushPromises();

    const lookupOptions = element.shadowRoot.querySelectorAll(
      "c-lookup-option"
    );
    expect(lookupOptions.length).toBe(2);
  });

  it("should do all the things when the keys are pressed", async () => {
    const mockOptionSelectedHandler = jest.fn();
    getLookupOptions.mockResolvedValue(OPTIONS);
    jest.useFakeTimers();

    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [];
    element.addEventListener("optionselect", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const combobox = element.shadowRoot.querySelector(".slds-combobox");
    let inputEl = element.shadowRoot.querySelector("input");
    inputEl.focus();

    inputEl.value = "cla";
    inputEl.dispatchEvent(new Event("input"));
    jest.runAllTimers();
    await flushPromises();

    const e = new Event("keydown");
    e.keyCode = KEYS.DOWN_ARROW;
    inputEl.dispatchEvent(e);
    expect(combobox.classList).toContain("slds-is-open");

    e.keyCode = KEYS.ESCAPE;
    inputEl.dispatchEvent(e);
    await Promise.resolve();
    expect(combobox.classList).not.toContain("slds-is-open");

    inputEl.dispatchEvent(new Event("input"));
    jest.runAllTimers();
    await flushPromises();

    e.keyCode = KEYS.DOWN_ARROW;
    inputEl.dispatchEvent(e);

    e.keyCode = KEYS.DOWN_ARROW;
    inputEl.dispatchEvent(e);

    e.keyCode = KEYS.UP_ARROW;
    inputEl.dispatchEvent(e);

    e.keyCode = KEYS.UP_ARROW;
    inputEl.dispatchEvent(e);

    e.keyCode = KEYS.DOWN_ARROW;
    inputEl.dispatchEvent(e);

    e.keyCode = KEYS.ENTER;
    inputEl.dispatchEvent(e);

    await Promise.resolve();
    inputEl = element.shadowRoot.querySelector("input");

    expect(inputEl.value).toBe("");
    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const optionSelectedEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(optionSelectedEvent.detail).toEqual(OPTIONS[0]);
  });

  it("should clear the input on click of the x", async () => {
    const element = createElement("c-lookup", {
      is: Lookup
    });

    element.selectedOption = {};
    element.filterList = [];
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("input");
    inputEl.value = "something";
    const clearButton = element.shadowRoot.querySelector(".slds-button");
    clearButton.click();

    await Promise.resolve();
    expect(inputEl.value).toBe("");
  });
});

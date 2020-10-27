/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import FilterList from "c/FilterList";

describe("c-filter-list", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("fires filterchange event when active checkbox changed", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-filter-list", {
      is: FilterList
    });

    element.list = [];
    element.filterType = "blocklist";
    element.addEventListener("filterchange", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const inputEl = element.shadowRoot.querySelector("lightning-input");
    inputEl.dispatchEvent(
      new CustomEvent("change", { detail: { checked: true } })
    );

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const filterChangeEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(filterChangeEvent.detail).toEqual({
      type: element.filterType,
      value: true
    });
  });

  it("fires useradd event when option selected from lookup", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-filter-list", {
      is: FilterList
    });

    element.list = [];
    element.filterType = "blocklist";
    element.addEventListener("useradd", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const lookup = element.shadowRoot.querySelector("c-lookup");
    const EVENT_DETAIL = { value: "1", label: "2", picture: "3" };
    const e = new CustomEvent("optionselect", { detail: EVENT_DETAIL });
    lookup.dispatchEvent(e);

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const userAddEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(userAddEvent.detail).toEqual({
      dcstuff__User__r: {
        Id: EVENT_DETAIL.value,
        Name: EVENT_DETAIL.label,
        SmallPhotoUrl: EVENT_DETAIL.picture
      }
    });
  });

  it("fires userdelete event when user deleted", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-filter-list", {
      is: FilterList
    });

    element.list = [
      {
        Id: "1",
        dcstuff__User__r: {
          Id: "1",
          Name: "2",
          SmallPhotoUrl: "3"
        }
      }
    ];
    element.filterType = "blocklist";
    element.addEventListener("userdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const deleteIconEl = element.shadowRoot.querySelector("lightning-icon");
    const e = new Event("keydown");
    e.keyCode = 13;
    deleteIconEl.dispatchEvent(e);

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const userDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(userDeleteEvent.detail).toBe(element.list[0].Id);
  });
});

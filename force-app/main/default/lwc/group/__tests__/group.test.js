/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Group from "c/Group";

describe("c-group", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows add member options when add button clicked", async () => {
    const element = createElement("c-group", {
      is: Group
    });

    element.group = { g: { Id: "1" }, members: [] };
    document.body.appendChild(element);

    let lookup = element.shadowRoot.querySelector("c-lookup");
    expect(lookup).toBeNull();

    const addButtonEl = element.shadowRoot.querySelector(".adduser");
    addButtonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    lookup = element.shadowRoot.querySelector("c-lookup");
    expect(lookup).not.toBeNull();
  });

  it("fires memberadd event when option selected from lookup", async () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-group", {
      is: Group
    });

    element.group = { g: { Id: "1" }, members: [] };
    element.addEventListener("memberadd", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const addButtonEl = element.shadowRoot.querySelector(".adduser");
    addButtonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const divEl = element.shadowRoot.querySelector("c-lookup");
    const EVENT_DETAIL = { value: "1", label: "2", picture: "3" };
    const e = new CustomEvent("optionselect", { detail: EVENT_DETAIL });
    divEl.dispatchEvent(e);

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const userAddEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(userAddEvent.detail).toEqual({
      dcstuff__User__r: {
        Id: EVENT_DETAIL.value,
        Name: EVENT_DETAIL.label,
        SmallPhotoUrl: EVENT_DETAIL.picture
      },
      groupId: element.group.g.Id
    });
  });

  it("fires groupdelete event when group deleted", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-group", {
      is: Group
    });

    element.group = { g: { Id: "1" }, members: [] };
    element.addEventListener("groupdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const deleteButtonEl = element.shadowRoot.querySelector(".deletegroup");
    deleteButtonEl.dispatchEvent(new Event("click"));

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const groupDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(groupDeleteEvent.detail).toBe(element.group.g.Id);
  });

  it("fires memberdelete event when member deleted", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-group", {
      is: Group
    });

    element.group = { g: { Id: "1" }, members: [{ Id: "123", groupId: "1" }] };
    element.addEventListener("memberdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const groupMember = element.shadowRoot.querySelector("c-group-member");
    groupMember.dispatchEvent(
      new CustomEvent("memberdelete", { detail: element.group.members[0] })
    );

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const memberDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(memberDeleteEvent.detail).toEqual(element.group.members[0]);
  });
});

/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Groups from "c/Groups";

describe("c-groups", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows add group options when add button clicked", async () => {
    const element = createElement("c-groups", {
      is: Groups
    });

    element.groups = [];
    document.body.appendChild(element);

    let newGroup = element.shadowRoot.querySelector(".newName");
    expect(newGroup).toBeNull();

    const addButtonEl = element.shadowRoot.querySelector(".addgroup");
    addButtonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    newGroup = element.shadowRoot.querySelector(".newName");
    expect(newGroup).not.toBeNull();
  });

  it("fires groupadd event when group added", async () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-groups", {
      is: Groups
    });

    element.groups = [];
    element.addEventListener("groupadd", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const addButtonEl = element.shadowRoot.querySelector(".addgroup");
    addButtonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const newGroup = element.shadowRoot.querySelector(".newName");
    newGroup.value = "blah";

    const e = new Event("keyup");
    e.keyCode = 13;
    newGroup.dispatchEvent(e);

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const groupAddEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(groupAddEvent.detail).toBe(newGroup.value);
  });

  it("fires groupdelete event when group deleted", async () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-groups", {
      is: Groups
    });

    element.groups = [{ g: { Id: "1" }, members: [] }];
    element.addEventListener("groupdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const groupEl = element.shadowRoot.querySelector("c-group");
    groupEl.dispatchEvent(
      new CustomEvent("groupdelete", { detail: element.groups[0].g.Id })
    );

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const groupDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(groupDeleteEvent.detail).toBe(element.groups[0].g.Id);
  });

  it("fires memberadd event when member added to group", async () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-groups", {
      is: Groups
    });

    element.groups = [{ g: { Id: "1" }, members: [] }];
    element.addEventListener("memberadd", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const newMember = {
      dcstuff__User__r: {
        Id: "1",
        Name: "2",
        SmallPhotoUrl: "3"
      },
      groupId: element.groups[0].g.Id
    };

    const groupEl = element.shadowRoot.querySelector("c-group");
    groupEl.dispatchEvent(new CustomEvent("memberadd", { detail: newMember }));

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const memberAddEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(memberAddEvent.detail).toBe(newMember);
  });

  it("fires memberdelete event when member deleted", async () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-groups", {
      is: Groups
    });

    element.groups = [
      { g: { Id: "1" }, members: [{ Id: "123", groupId: "1" }] }
    ];
    element.addEventListener("memberdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const groupEl = element.shadowRoot.querySelector("c-group");
    groupEl.dispatchEvent(
      new CustomEvent("memberdelete", { detail: element.groups[0].members[0] })
    );

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const memberDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(memberDeleteEvent.detail).toEqual(element.groups[0].members[0]);
  });
});

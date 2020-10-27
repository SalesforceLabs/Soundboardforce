/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import GroupMember from "c/GroupMember";

describe("c-group-member", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("fires memberdelete event when user deleted", () => {
    const mockOptionSelectedHandler = jest.fn();

    const element = createElement("c-group-member", {
      is: GroupMember
    });

    element.member = {
      Id: "1",
      dcstuff__User__r: {
        Id: "1",
        Name: "2",
        SmallPhotoUrl: "3"
      },
      dcstuff__SoundboardGroup__c: "123"
    };
    element.addEventListener("memberdelete", mockOptionSelectedHandler);
    document.body.appendChild(element);

    const deleteIconEl = element.shadowRoot.querySelector("lightning-icon");
    const e = new Event("keydown");
    e.keyCode = 13;
    deleteIconEl.dispatchEvent(e);

    expect(mockOptionSelectedHandler).toHaveBeenCalledTimes(1);

    const memberDeleteEvent = mockOptionSelectedHandler.mock.calls[0][0];
    expect(memberDeleteEvent.detail).toEqual({
      id: element.member.Id,
      groupId: element.member.dcstuff__SoundboardGroup__c
    });
  });
});

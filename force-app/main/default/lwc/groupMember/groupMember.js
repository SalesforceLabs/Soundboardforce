/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

import labels from "./labels";

const KEYS = {
  ENTER: 13,
  SPACE: 32
};

export default class GroupMember extends LightningElement {
  label = labels;

  @api member;

  handleMemberDeleteKeyDown(event) {
    if (event.keyCode === KEYS.ENTER || event.keyCode === KEYS.SPACE) {
      event.preventDefault();
      this.handleMemberDelete(event);
    }
  }

  handleMemberDelete(event) {
    this.dispatchEvent(
      new CustomEvent("memberdelete", {
        detail: {
          id: event.target.dataset.value,
          groupId: this.member.dcstuff__SoundboardGroup__c
        }
      })
    );
  }
}

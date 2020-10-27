/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

import labels from "./labels";

const MAX_GROUP_SIZE = 30;

export default class Group extends LightningElement {
  label = labels;

  static delegatesFocus = true;

  @api group;

  isAddingMember = false;

  renderedCallback() {
    if (this.addingMemberFocused) {
      this.addingMemberFocused = false;
      this.template.querySelector("c-lookup").focus();
    }
  }

  get isGroupFull() {
    return this.group.members.length === MAX_GROUP_SIZE;
  }

  get memberMessage() {
    return `${this.group.members.length} / ${MAX_GROUP_SIZE} ${
      this.label.Members
    }${this.isGroupFull ? ` - ${this.label.Group_full}` : ""}`;
  }

  handleAddMemberVisible() {
    this.isAddingMember = !this.isAddingMember;
    this.addingMemberFocused = this.isAddingMember;
  }

  handleOptionSelect(event) {
    const user = event.detail;
    this.dispatchEvent(
      new CustomEvent("memberadd", {
        detail: {
          dcstuff__User__r: {
            Id: user.value,
            Name: user.label,
            SmallPhotoUrl: user.picture
          },
          groupId: this.group.g.Id
        }
      })
    );
  }

  handleGroupDelete(event) {
    this.dispatchEvent(
      new CustomEvent("groupdelete", {
        detail: event.currentTarget.dataset.value
      })
    );
  }

  handleMemberDelete(event) {
    this.dispatchEvent(
      new CustomEvent("memberdelete", {
        detail: event.detail
      })
    );
  }
}

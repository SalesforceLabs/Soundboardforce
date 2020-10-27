/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api, track, wire } from "lwc";

import { subscribe, onError } from "lightning/empApi";

import {
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord
} from "lightning/uiRecordApi";

import getSoundboard from "@salesforce/apex/SoundboardUtilities.getSoundboard";
import sendPlayEvent from "@salesforce/apex/SoundboardUtilities.sendPlayEvent";

import MISSING_PERMISSIONS_IMAGE from "@salesforce/resourceUrl/Missing_permissions";

import ID_FIELD from "@salesforce/schema/Soundboard__c.Id";
import IS_ACTIVE_FIELD from "@salesforce/schema/Soundboard__c.IsActive__c";
import IS_ALLOWLIST_ENABLED_FIELD from "@salesforce/schema/Soundboard__c.IsAllowlistEnabled__c";
import IS_BLOCKLIST_ENABLED_FIELD from "@salesforce/schema/Soundboard__c.IsBlocklistEnabled__c";
import SEND_TO_ID_FIELD from "@salesforce/schema/Soundboard__c.SendToId__c";

import USER_TO_FILTERLIST_OBJECT from "@salesforce/schema/UserToFilterlist__c";
import FILTERLIST_USER_FIELD from "@salesforce/schema/UserToFilterlist__c.User__c";
import FILTERLIST_FIELD from "@salesforce/schema/UserToFilterlist__c.Filterlist__c";

import USER_TO_SOUNDBOARD_GROUP_OBJECT from "@salesforce/schema/UserToSoundboardGroup__c";
import SOUNDBOARD_GROUP_FIELD from "@salesforce/schema/UserToSoundboardGroup__c.SoundboardGroup__c";
import USER_TO_SOUNDBOARD_GROUP_USER_FIELD from "@salesforce/schema/UserToSoundboardGroup__c.User__c";

import SOUNDBOARDGROUP_OBJECT from "@salesforce/schema/SoundboardGroup__c";
import SOUNDBOARD_FIELD from "@salesforce/schema/SoundboardGroup__c.Soundboard__c";
import NAME_FIELD from "@salesforce/schema/SoundboardGroup__c.Name";

import userId from "@salesforce/user/Id";

import { getSoundIndex } from "./soundboardUtilities";
import labels from "./labels";
import sounds from "./sounds";

const NO_PERMISO = "No permiso!";
const SOUND_DISPLAY_INTERVAL = 150;
const PLAY_EVENT = "/event/dcstuff__PlayEvent__e";

const KEYS = {
  ENTER: 13,
  SPACE: 32,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39
};

const USER_FIELDS = ["User.Name", "User.SmallPhotoUrl"];

/* eslint-disable no-console */

export default class SoundBoard extends LightningElement {
  userId = userId;
  label = labels;
  sounds = sounds;
  missingPermissionsImage = MISSING_PERMISSIONS_IMAGE;

  channelName = PLAY_EVENT;
  _isOpen;
  noPermiso = false;
  isLoading = true;
  showGroups = false;
  showAllowlist = false;
  showBlocklist = false;
  showSendTo = false;
  showSounds = true;
  @track soundboard = {};
  selectedOption = {};
  soundEl = [];
  readyToRock;
  @track notifications = [];
  showNotification = false;
  messageKey = 0;

  @wire(getRecord, { recordId: "$userId", fields: USER_FIELDS })
  user;

  async connectedCallback() {
    this.soundboard.s = {};
    this.handleSubscribe();

    try {
      this.soundboard = await getSoundboard();
      this.isLoading = false;
      if (this.isOpen) {
        this.loadSounds();
      }
    } catch (e) {
      console.error(
        e.body && e.body.message
          ? e.body.message
          : JSON.parse(JSON.stringify(e))
      );
      this.isLoading = false;
      if (e.body && e.body.message.startsWith(NO_PERMISO)) {
        this.noPermiso = true;
      }
    }
  }

  renderedCallback() {
    if (!this.showSounds && !this.subpanelAriaSet) {
      let tabId;
      let label;

      if (this.showGroups) {
        tabId = this.template.querySelector(".btn-groups").id;
        label = "tab__groups";
        if (!this.keyDownTabCycle) {
          this.template.querySelector("c-groups").focus();
        }
      } else if (this.showAllowlist) {
        tabId = this.template.querySelector(".btn-allowlist").id;
        label = "tab__allowlist";
        if (!this.keyDownTabCycle) {
          this.template.querySelector("c-filter-list").focus();
        }
      } else if (this.showBlocklist) {
        tabId = this.template.querySelector(".btn-blocklist").id;
        label = "tab__blocklist";
        if (!this.keyDownTabCycle) {
          this.template.querySelector("c-filter-list").focus();
        }
      } else if (this.showSendTo) {
        this.template.querySelector("c-lookup").focus();
      }

      this.keyDownTabCycle = false;
      this.subpanelAriaSet = true;
      this.setSubpanelAria(tabId, label);
    }
  }

  setSubpanelAria(id, label) {
    const subpanel = this.template.querySelector(".subpanel");

    if (id) {
      subpanel.setAttribute("id", id);
      subpanel.setAttribute("aria-labelledby", label);
    } else {
      subpanel.removeAttribute("id");
      subpanel.removeAttribute("aria-labelledby");
    }
  }

  @api get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    this._isOpen = value;
    if (!this.isLoading && !this.isOpenedOnce && value) {
      this.isOpenedOnce = true;
      this.loadSounds();
    }
  }

  get soundWrapperClass() {
    return `sound-wrapper${this.showSounds ? "" : " slds-hide"}`;
  }

  get containerClass() {
    return this.readyToRock ? "" : "slds-hide";
  }

  get sendToName() {
    return this.soundboard.s.dcstuff__SendToId__c === this.userId
      ? this.label.You
      : this.soundboard.sendToName;
  }

  get showPowerOff() {
    return !this.soundboard.s.dcstuff__IsActive__c && this.showSounds;
  }

  get showGroupsTabindex() {
    return this.getTabindex(this.showGroups);
  }

  get showAllowlistTabindex() {
    return this.getTabindex(this.showAllowlist);
  }

  get showBlocklistTabindex() {
    return this.getTabindex(this.showBlocklist);
  }

  getTabindex(showVar) {
    return this.showSounds || this.showSendTo || showVar ? "0" : "-1";
  }

  toggleIsActive(event) {
    this.soundboard.s.dcstuff__IsActive__c = event.target.checked;

    const fields = {};
    fields[
      IS_ACTIVE_FIELD.fieldApiName
    ] = this.soundboard.s.dcstuff__IsActive__c;
    this.updateSoundboard(fields);
  }

  toggleSetting(event) {
    const field = event.currentTarget.dataset.field;
    this.soundboard.s[field] = !this.soundboard.s[field];

    const fields = {};
    fields[field] = this.soundboard.s[field];
    this.updateSoundboard(fields);
  }

  handleGroupsKeyDown(event) {
    if (this.showGroups) {
      switch (event.keyCode) {
        case KEYS.LEFT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-blocklist").focus();
          this.handleBlocklist();
          break;
        case KEYS.RIGHT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-allowlist").focus();
          this.handleAllowlist();
          break;
        default:
          break;
      }
    }
  }

  handleAllowlistKeyDown(event) {
    if (this.showAllowlist) {
      switch (event.keyCode) {
        case KEYS.LEFT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-groups").focus();
          this.handleGroups();
          break;
        case KEYS.RIGHT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-blocklist").focus();
          this.handleBlocklist();
          break;
        default:
          break;
      }
    }
  }

  handleBlocklistKeyDown(event) {
    if (this.showBlocklist) {
      switch (event.keyCode) {
        case KEYS.LEFT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-allowlist").focus();
          this.handleAllowlist();
          break;
        case KEYS.RIGHT_ARROW:
          event.preventDefault();
          this.keyDownTabCycle = true;
          this.template.querySelector(".btn-groups").focus();
          this.handleGroups();
          break;
        default:
          break;
      }
    }
  }

  handleGroupsClick() {
    this.keyDownTabCycle = false;
    this.handleGroups();
  }

  handleGroups() {
    this.showSounds = false;
    this.showGroups = true;
    this.showAllowlist = false;
    this.showBlocklist = false;
    this.showSendTo = false;
    this.showNotification = false;
    this.subpanelAriaSet = false;
    this.subpanelTitle = this.label.Manage_groups;
  }

  handleAllowlistClick() {
    this.keyDownTabCycle = false;
    this.handleAllowlist();
  }

  handleAllowlist() {
    this.showSounds = false;
    this.showGroups = false;
    this.showAllowlist = true;
    this.showBlocklist = false;
    this.showSendTo = false;
    this.showNotification = false;
    this.subpanelAriaSet = false;
    this.subpanelTitle = this.label.Allowlist;
  }

  handleBlocklistClick() {
    this.keyDownTabCycle = false;
    this.handleBlocklist();
  }

  handleBlocklist() {
    this.showSounds = false;
    this.showGroups = false;
    this.showAllowlist = false;
    this.showBlocklist = true;
    this.showSendTo = false;
    this.showNotification = false;
    this.subpanelAriaSet = false;
    this.subpanelTitle = this.label.Blocklist;
  }

  handleSendToKeyDown(event) {
    if (event.keyCode === KEYS.ENTER || event.keyCode === KEYS.SPACE) {
      event.preventDefault();
      this.handleSendToClick(event);
    }
  }

  handleSendToClick() {
    this.showSounds = false;
    this.showGroups = false;
    this.showAllowlist = false;
    this.showBlocklist = false;
    this.showSendTo = true;
    this.showNotification = false;
    this.subpanelAriaSet = false;
    this.subpanelTitle = this.label.Send_to;
  }

  handleSoundKeyDown(event) {
    let index = getSoundIndex(event, sounds);
    if (index !== -1) {
      event.preventDefault();
      this.soundEls[index].focus();
    }
  }

  loadSounds() {
    this.readyToRock = true;
    this.soundEls = this.template.querySelectorAll("c-sound");

    const numberOfSounds = this.soundEls.length;
    let remaining = numberOfSounds;
    const visibleSounds = {};

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    let interval = setInterval(() => {
      let soundIndex = Math.floor(Math.random() * Math.floor(numberOfSounds));

      let isValidIndex = false;
      while (!isValidIndex) {
        if (visibleSounds[soundIndex]) {
          soundIndex++;

          if (soundIndex === numberOfSounds) {
            soundIndex = 0;
          }
        } else {
          visibleSounds[soundIndex] = true;
          isValidIndex = true;
          this.soundEls[soundIndex].classList.remove("slds-hidden");
        }
      }

      remaining--;
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, SOUND_DISPLAY_INTERVAL);
  }

  async handleSubscribe() {
    const messageCallback = async response => {
      if (
        this.soundboard.s.dcstuff__IsActive__c &&
        ((response.data.payload.CreatedById === this.userId &&
          this.soundboard.s.dcstuff__PlayOwnSounds__c) ||
          (JSON.parse(response.data.payload.dcstuff__SendToIds__c).includes(
            this.userId
          ) &&
            (!this.soundboard.s.dcstuff__IsAllowlistEnabled__c ||
              this.soundboard.allowlistUsers
                .map(u => u.Id)
                .includes(response.data.payload.CreatedById)) &&
            (!this.soundboard.s.dcstuff__IsBlocklistEnabled__c ||
              !this.soundboard.blocklistUsers
                .map(u => u.Id)
                .includes(response.data.payload.CreatedById)) &&
            (!response.data.payload.dcstuff__IsAnonymous__c ||
              this.soundboard.s.dcstuff__AllowsAnonymous__c)))
      ) {
        this.play(response.data.payload);
      }
    };

    this.registerErrorListener();
    this.subscription = await subscribe(this.channelName, -1, messageCallback);
  }

  play(sound) {
    this.dispatchEvent(new CustomEvent("soundincoming"));

    if (
      (document.hasFocus() || this.soundboard.s.dcstuff__NoMatterWhat__c) &&
      this.soundboard.s.dcstuff__IsSoundOn__c
    ) {
      const audio = new Audio(sound.dcstuff__SoundUrl__c);
      audio.load();
      audio.play();
    }

    if (sound.CreatedById !== this.userId) {
      this.notifications = [
        {
          key: this.messageKey++,
          message: (sound.dcstuff__IsAnonymous__c
            ? this.label.Notification_from_anonymous
            : this.label.Notification_from_person
          )
            .replace("{0}", sound.dcstuff__SenderName__c)
            .replace(
              "{1}",
              `<span style="font-weight: normal; font-style: italic;">${sound.dcstuff__Title__c}</span>`
            )
        },
        ...this.notifications.slice(0, 3)
      ];

      const el = this.template.querySelector(".notification");
      el.classList.remove("show-notification");
      this.showNotification = false;
      void el.offsetWidth; // eslint-disable-line no-void
      this.showNotification = true;
      el.classList.add("show-notification");
    }
  }

  registerErrorListener() {
    onError(error => {
      console.error(`Received error from server: ${JSON.stringify(error)}`);
    });
  }

  handleSoundClick(event) {
    sendPlayEvent({
      soundUrl: event.detail.url,
      title: event.detail.title,
      sendToId: this.soundboard.s.dcstuff__SendToId__c,
      isAnonymous: this.soundboard.s.dcstuff__SendAnonymous__c
    });
  }

  get notificationClass() {
    return `notification${this.showNotification ? " show-notification" : ""}`;
  }

  restoreSoundsKeyDown(event) {
    if (event.keyCode === KEYS.ENTER || event.keyCode === KEYS.SPACE) {
      event.preventDefault();
      this.restoreSounds();
    }
  }

  restoreSounds() {
    this.showSounds = true;
    this.showGroups = false;
    this.showAllowlist = false;
    this.showBlocklist = false;
    this.showSendTo = false;
  }

  handleOptionSelect(event) {
    this.soundboard.sendToName = event.detail.label;
    this.soundboard.photoUrl = event.detail.picture;
    this.soundboard.s.dcstuff__SendToId__c = event.detail.value;
    this.restoreSounds();

    const fields = {};
    fields[
      SEND_TO_ID_FIELD.fieldApiName
    ] = this.soundboard.s.dcstuff__SendToId__c;
    this.updateSoundboard(fields);
  }

  handleFilterChange(event) {
    const fields = {};

    if (event.detail.type === "Allowlist") {
      this.soundboard.s.dcstuff__IsAllowlistEnabled__c = event.detail.value;
      fields[
        IS_ALLOWLIST_ENABLED_FIELD.fieldApiName
      ] = this.soundboard.s.dcstuff__IsAllowlistEnabled__c;
    } else {
      this.soundboard.s.dcstuff__IsBlocklistEnabled__c = event.detail.value;
      fields[
        IS_BLOCKLIST_ENABLED_FIELD.fieldApiName
      ] = this.soundboard.s.dcstuff__IsBlocklistEnabled__c;
    }

    this.updateSoundboard(fields);
  }

  async updateSoundboard(fields) {
    fields[ID_FIELD.fieldApiName] = this.soundboard.s.Id;

    try {
      await updateRecord({ fields });
    } catch (e) {
      console.error(e);
    }
  }

  handleAllowlistUserAdd(event) {
    this.handleUserAdd(event, "allowlistUsers", this.soundboard.allowlistId);
  }

  handleBlocklistUserAdd(event) {
    this.handleUserAdd(event, "blocklistUsers", this.soundboard.blocklistId);
  }

  async handleUserAdd(event, filter, filterId) {
    const fields = {};
    fields[FILTERLIST_USER_FIELD.fieldApiName] =
      event.detail.dcstuff__User__r.Id;
    fields[FILTERLIST_FIELD.fieldApiName] = filterId;

    const recordInput = {
      apiName: USER_TO_FILTERLIST_OBJECT.objectApiName,
      fields
    };

    try {
      const record = await createRecord(recordInput);
      event.detail.Id = record.id;
      this.soundboard[filter] = [...this.soundboard[filter], event.detail].sort(
        this.compareUsers
      );
    } catch (e) {
      console.error(e);
    }
  }

  handleAllowlistUserDelete(event) {
    this.handleUserDelete(event, "allowlistUsers");
  }

  handleBlocklistUserDelete(event) {
    this.handleUserDelete(event, "blocklistUsers");
  }

  async handleUserDelete(event, filter) {
    const index = this.soundboard[filter].findIndex(u => u.Id === event.detail);

    if (index !== -1) {
      this.soundboard[filter].splice(index, 1);
      this.soundboard[filter] = [...this.soundboard[filter]];
    } else {
      console.error("handleUserDelete index not found");
    }

    try {
      await deleteRecord(event.detail);
    } catch (e) {
      console.error(e);
    }
  }

  async handleGroupAdd(event) {
    const fields = {};
    fields[SOUNDBOARD_FIELD.fieldApiName] = this.soundboard.s.Id;
    fields[NAME_FIELD.fieldApiName] = event.detail;

    const recordInput = {
      apiName: SOUNDBOARDGROUP_OBJECT.objectApiName,
      fields
    };

    try {
      const record = await createRecord(recordInput);
      this.soundboard.groups = [
        ...this.soundboard.groups,
        {
          g: {
            Id: record.id,
            Name: record.fields.Name.value
          },
          members: []
        }
      ].sort(this.compareGroups);
    } catch (e) {
      console.error(e);
    }
  }

  async handleGroupDelete(event) {
    const index = this.soundboard.groups.findIndex(
      group => group.g.Id === event.detail
    );

    if (index !== -1) {
      this.soundboard.groups.splice(index, 1);
      this.soundboard.groups = [...this.soundboard.groups];

      if (event.detail === this.soundboard.s.dcstuff__SendToId__c) {
        this.soundboard.sendToName = this.user.data.fields.Name.value;
        this.soundboard.photoUrl = this.user.data.fields.SmallPhotoUrl.value;
        this.soundboard.s.dcstuff__SendToId__c = userId;

        const fields = {};
        fields[
          SEND_TO_ID_FIELD.fieldApiName
        ] = this.soundboard.s.dcstuff__SendToId__c;
        console.log("hey1");
        this.updateSoundboard(fields);
      }
    } else {
      console.error("handleGroupDelete index not found");
    }

    try {
      await deleteRecord(event.detail);
    } catch (e) {
      console.error(e);
    }
  }

  async handleMemberAdd(event) {
    const fields = {};
    fields[SOUNDBOARD_GROUP_FIELD.fieldApiName] = event.detail.groupId;
    fields[USER_TO_SOUNDBOARD_GROUP_USER_FIELD.fieldApiName] =
      event.detail.dcstuff__User__r.Id;

    const recordInput = {
      apiName: USER_TO_SOUNDBOARD_GROUP_OBJECT.objectApiName,
      fields
    };

    try {
      const record = await createRecord(recordInput);

      const index = this.soundboard.groups.findIndex(
        group => group.g.Id === event.detail.groupId
      );

      if (index !== -1) {
        this.soundboard.groups[index].members = [
          ...this.soundboard.groups[index].members,
          {
            Id: record.id,
            dcstuff__SoundboardGroup__c: event.detail.groupId,
            dcstuff__User__r: event.detail.dcstuff__User__r
          }
        ].sort(this.compareUsers);
      } else {
        console.error("handleMemberAdd index not found");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleMemberDelete(event) {
    const index = this.soundboard.groups.findIndex(
      g => g.g.Id === event.detail.groupId
    );

    if (index !== -1) {
      const mIndex = this.soundboard.groups[index].members.findIndex(
        member => member.Id === event.detail.id
      );

      if (mIndex !== -1) {
        this.soundboard.groups[index].members.splice(mIndex, 1);
        this.soundboard.groups[index].members = [
          ...this.soundboard.groups[index].members
        ];
      }
    } else {
      console.error("handleMemberDelete index not found");
    }

    try {
      await deleteRecord(event.detail.id);
    } catch (e) {
      console.error(e);
    }
  }

  compareUsers(a, b) {
    if (a.dcstuff__User__r.Name === b.dcstuff__User__r.Name) {
      return 0;
    }

    if (a.dcstuff__User__r.Name < b.dcstuff__User__r.Name) {
      return -1;
    }

    return 0;
  }

  compareGroups(a, b) {
    if (a.g.Name === b.g.Name) {
      return 0;
    }

    if (a.g.Name < b.g.Name) {
      return -1;
    }

    return 0;
  }
}

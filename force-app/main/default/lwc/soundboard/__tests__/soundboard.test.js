/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Soundboard from "c/soundboard";

import { subscribe } from "lightning/empApi";
import {
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord
} from "lightning/uiRecordApi";

import { registerLdsTestWireAdapter } from "@salesforce/sfdx-lwc-jest";

import getSoundboard from "@salesforce/apex/SoundboardUtilities.getSoundboard";
import sendPlayEvent from "@salesforce/apex/SoundboardUtilities.sendPlayEvent";

import { getSoundIndex } from "../soundboardUtilities";

jest.useFakeTimers();

jest.mock(
  "@salesforce/apex/SoundboardUtilities.getSoundboard",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

jest.mock(
  "@salesforce/apex/SoundboardUtilities.sendPlayEvent",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

const MOCKED_SOUNDBOARD = {
  s: {
    Id: "hey hey",
    dcstuff__AllowsAnonymous__c: true,
    dcstuff__IsActive__c: true,
    dcstuff__IsAllowlistEnabled__c: false,
    dcstuff__IsBlocklistEnabled__c: false,
    dcstuff__IsSoundOn__c: true,
    dcstuff__SendToId__c: "123",
    dcstuff__NoMatterWhat__c: false,
    dcstuff__PlayOwnSounds__c: true,
    dcstuff__SendAnonymous__c: true
  },
  allowlistId: "allowlistId",
  allowlistUsers: [],
  blocklistUsers: [],
  groups: [{ g: { Id: "123" } }],
  sendToName: "baddabing"
};

// sfdx-lwc-jest automocks @salesforce/user/Id to this const value.
const USER_ID = "005000000000000000";

const USER = {
  fields: {
    Name: {
      value: "blah"
    },
    SmallPhotoUrl: {
      value: "blah.jpg"
    }
  }
};

const KEYS = {
  ENTER: 13,
  SPACE: 32,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  UP_ARROW: 38,
  DOWN_ARROW: 40,
  HOME: 36,
  END: 35
};

const getRecordAdapter = registerLdsTestWireAdapter(getRecord);

describe("c-soundboard", () => {
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

  async function getValidSoundboard() {
    getSoundboard.mockResolvedValue(
      JSON.parse(JSON.stringify(MOCKED_SOUNDBOARD))
    );

    const element = createElement("c-soundboard", {
      is: Soundboard
    });
    element.isOpen = true;
    document.body.appendChild(element);

    getRecordAdapter.emit(USER);

    await flushPromises();

    jest.runAllTimers();

    return element;
  }

  it("should load THE PICKLE when user lacks permissions", async () => {
    let error = new Error();
    error.body = { message: "No permiso!" };
    getSoundboard.mockRejectedValue(error);

    const element = createElement("c-soundboard", {
      is: Soundboard
    });
    document.body.appendChild(element);

    await flushPromises();

    const noPermiso = element.shadowRoot.querySelector(".noPermiso");
    expect(noPermiso).not.toBeNull();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect(soundboard).toBeNull();

    const soundEls = element.shadowRoot.querySelectorAll("c-sound");
    expect(soundEls.length).toBe(0);

    const sendToName = element.shadowRoot.querySelector(".send-to-name");
    expect(sendToName).toBeNull();
  });

  it("should load the soundboard when user has permissions", async () => {
    const element = await getValidSoundboard();

    const noPermiso = element.shadowRoot.querySelector(".noPermiso");
    expect(noPermiso).toBeNull();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect(soundboard).not.toBeNull();
    expect([...soundboard.classList].includes("slds-hide")).toBe(false);

    const soundEls = element.shadowRoot.querySelectorAll("c-sound");
    expect(soundEls.length).toBeGreaterThan(1);

    const sendToName = element.shadowRoot.querySelector(".send-to-name");
    expect(sendToName.textContent).toBe(MOCKED_SOUNDBOARD.sendToName);
  });

  it("should toggle the power when the power button is clicked", async () => {
    const element = await getValidSoundboard();

    let powerOffEl = element.shadowRoot.querySelector(".poweroff");
    expect(powerOffEl).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-isactive");
    expect(buttonEl).not.toBeNull();

    buttonEl.checked = false;
    buttonEl.dispatchEvent(new Event("change"));

    await Promise.resolve();

    powerOffEl = element.shadowRoot.querySelector(".poweroff");
    expect(powerOffEl).not.toBeNull();
  });

  it("should toggle sounds when the sounds button is clicked", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-sound");
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.iconName).toBe("utility:volume_high");
    expect(buttonEl.alternativeText).toBe("c.Turn_on_sound_alt_text");
    expect(buttonEl.selected).toBe(true);

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    expect(buttonEl.selected).toBe(false);
  });

  it("should toggle anonymous sounds when the allow anonymous button is clicked", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-allow-anonymous");
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.iconName).toBe("utility:question");
    expect(buttonEl.alternativeText).toBe("c.Allow_anonymous_alt_text");
    expect(buttonEl.selected).toBe(true);

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    expect(buttonEl.selected).toBe(false);
  });

  it("should toggle own sounds when the play own sounds button is clicked", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-play-own-sounds");
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.iconName).toBe("utility:chat");
    expect(buttonEl.alternativeText).toBe("c.Play_own_alt_text");
    expect(buttonEl.selected).toBe(true);

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    expect(buttonEl.selected).toBe(false);
  });

  it("should toggle no matter what when the no matter what button is clicked", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-no-matter-what");
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.iconName).toBe("utility:broadcast");
    expect(buttonEl.alternativeText).toBe("c.No_matter_what_alt_text");
    expect(buttonEl.selected).toBe(false);

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    expect(buttonEl.selected).toBe(true);
  });

  it("should toggle send anonymous when send anonymous button clicked", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-send-anonymous");
    expect(buttonEl).not.toBeNull();
    expect(buttonEl.iconName).toBe("utility:question");
    expect(buttonEl.alternativeText).toBe("c.Send_anonymously_alt_text");
    expect(buttonEl.selected).toBe(true);

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    expect(buttonEl.selected).toBe(false);
  });

  it("should show the groups panel when the groups button is clicked", async () => {
    const element = await getValidSoundboard();

    let groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-groups");
    expect(buttonEl).not.toBeNull();

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect([...soundboard.classList].includes("slds-hide")).toBe(true);

    groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).not.toBeNull();

    const subpanel = element.shadowRoot.querySelector(".subpanel-title");
    expect(subpanel.textContent).toBe("c.Manage_groups");
  });

  it("should show the allowlist panel when the allowlist button is clicked", async () => {
    const element = await getValidSoundboard();

    let filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-allowlist");
    expect(buttonEl).not.toBeNull();

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect([...soundboard.classList].includes("slds-hide")).toBe(true);

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).not.toBeNull();
    expect(filterList.filterType).toBe("Allowlist");

    const subpanel = element.shadowRoot.querySelector(".subpanel-title");
    expect(subpanel.textContent).toBe("c.Allowlist");
  });

  it("should show the blocklist panel when the blocklist button is clicked", async () => {
    const element = await getValidSoundboard();

    let filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-blocklist");
    expect(buttonEl).not.toBeNull();

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect([...soundboard.classList].includes("slds-hide")).toBe(true);

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).not.toBeNull();
    expect(filterList.filterType).toBe("Blocklist");

    const subpanel = element.shadowRoot.querySelector(".subpanel-title");
    expect(subpanel.textContent).toBe("c.Blocklist");
  });

  it("should show the send to lookup when the when spacebar hit on send to section", async () => {
    const element = await getValidSoundboard();

    let lookup = element.shadowRoot.querySelector("c-lookup");
    expect(lookup).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-send-to");
    expect(buttonEl).not.toBeNull();

    const e = new Event("keydown");
    e.keyCode = KEYS.SPACE;
    buttonEl.dispatchEvent(e);

    await Promise.resolve();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect([...soundboard.classList].includes("slds-hide")).toBe(true);

    lookup = element.shadowRoot.querySelector("c-lookup");
    expect(lookup).not.toBeNull();

    const subpanel = element.shadowRoot.querySelector(".subpanel-title");
    expect(subpanel.textContent).toBe("c.Send_to");
  });

  it("should show restore the sound panel when the when spacebar hit on show sounds section", async () => {
    const element = await getValidSoundboard();

    let restoreSoundsEl = element.shadowRoot.querySelector(".restore-sounds");
    expect(restoreSoundsEl).toBeNull();

    const buttonEl = element.shadowRoot.querySelector(".btn-send-to");

    const e = new Event("keydown");
    e.keyCode = KEYS.SPACE;
    buttonEl.dispatchEvent(e);

    await Promise.resolve();

    const soundboard = element.shadowRoot.querySelector(".sound-wrapper");
    expect([...soundboard.classList].includes("slds-hide")).toBe(true);

    restoreSoundsEl = element.shadowRoot.querySelector(".restore-sounds");
    expect(restoreSoundsEl).not.toBeNull();

    restoreSoundsEl.dispatchEvent(e);

    await Promise.resolve();

    expect([...soundboard.classList].includes("slds-hide")).toBe(false);
  });

  it("should should send sound event when sound is clicked", async () => {
    const element = await getValidSoundboard();

    const sound1 = element.shadowRoot.querySelector("c-sound");
    expect(sound1).not.toBeNull();

    const SOUNDCLICKED_EVENT = { url: "blah", title: "more blah" };

    sound1.dispatchEvent(
      new CustomEvent("soundclicked", { detail: SOUNDCLICKED_EVENT })
    );

    expect(sendPlayEvent).toHaveBeenCalledWith({
      isAnonymous: MOCKED_SOUNDBOARD.s.dcstuff__SendAnonymous__c,
      sendToId: MOCKED_SOUNDBOARD.s.dcstuff__SendToId__c,
      soundUrl: SOUNDCLICKED_EVENT.url,
      title: SOUNDCLICKED_EVENT.title
    });
  });

  it("should update soundboard when send to changed", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-send-to");
    expect(buttonEl).not.toBeNull();

    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const SENDTO_EVENT = {
      label: "blah",
      picture: "also_blah",
      value: "even more blah"
    };

    const lookup = element.shadowRoot.querySelector("c-lookup");
    lookup.dispatchEvent(
      new CustomEvent("optionselect", { detail: SENDTO_EVENT })
    );

    expect(updateRecord).toHaveBeenCalledWith({
      fields: { Id: MOCKED_SOUNDBOARD.s.Id, SendToId__c: SENDTO_EVENT.value }
    });

    await Promise.resolve();

    const img = element.shadowRoot.querySelector("img");
    expect(img.src).toBe(`http://localhost/${SENDTO_EVENT.picture}`);

    const sendToName = element.shadowRoot.querySelector(".send-to-name");
    expect(sendToName.textContent).toBe(SENDTO_EVENT.label);
  });

  it("should update soundboard when allowlist is toggled", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-allowlist");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const FILTER_CHANGE_EVENT = {
      type: "Allowlist",
      value: true
    };

    const filterList = element.shadowRoot.querySelector("c-filter-list");
    filterList.dispatchEvent(
      new CustomEvent("filterchange", { detail: FILTER_CHANGE_EVENT })
    );

    expect(updateRecord).toHaveBeenCalledWith({
      fields: { Id: MOCKED_SOUNDBOARD.s.Id, IsAllowlistEnabled__c: true }
    });
  });

  it("should create allowlist user when allowlist user added", async () => {
    createRecord.mockResolvedValue({ id: "bacon" });

    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-allowlist");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const USER_ADD_EVENT = {
      dcstuff__User__r: {
        Id: "bibbity-bobbity"
      }
    };

    const filterList = element.shadowRoot.querySelector("c-filter-list");
    filterList.dispatchEvent(
      new CustomEvent("useradd", { detail: USER_ADD_EVENT })
    );

    expect(createRecord).toHaveBeenCalledWith({
      apiName: "UserToFilterlist__c",
      fields: {
        Filterlist__c: MOCKED_SOUNDBOARD.allowlistId,
        User__c: USER_ADD_EVENT.dcstuff__User__r.Id
      }
    });
  });

  it("should delete allowlist user when allowlist user deleted", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-allowlist");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const USER_DELETE_EVENT = "xyzdeleteme";

    const filterList = element.shadowRoot.querySelector("c-filter-list");
    filterList.dispatchEvent(
      new CustomEvent("userdelete", { detail: USER_DELETE_EVENT })
    );

    expect(deleteRecord).toHaveBeenCalledWith(USER_DELETE_EVENT);
  });

  it("should create group when group added", async () => {
    createRecord.mockResolvedValue({
      id: 123,
      fields: { Name: { value: "baddabing" } }
    });

    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-groups");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const GROUP_ADD_EVENT = "SANDWICH";

    const groups = element.shadowRoot.querySelector("c-groups");
    groups.dispatchEvent(
      new CustomEvent("groupadd", { detail: GROUP_ADD_EVENT })
    );

    expect(createRecord).toHaveBeenCalledWith({
      apiName: "SoundboardGroup__c",
      fields: {
        Soundboard__c: MOCKED_SOUNDBOARD.s.Id,
        Name: GROUP_ADD_EVENT
      }
    });
  });

  it("should delete group when group deleted", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-groups");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const GROUP_DELETE_EVENT = "123";

    const groups = element.shadowRoot.querySelector("c-groups");
    groups.dispatchEvent(
      new CustomEvent("groupdelete", { detail: GROUP_DELETE_EVENT })
    );

    expect(deleteRecord).toHaveBeenCalledWith(GROUP_DELETE_EVENT);

    const restoreSoundsEl = element.shadowRoot.querySelector(".restore-sounds");
    restoreSoundsEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const sendToName = element.shadowRoot.querySelector(".send-to-name");
    expect(sendToName.textContent).toBe("c.You");
  });

  it("should create group member when member added", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-groups");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const MEMBER_ADD_EVENT = {
      groupId: "whatever",
      dcstuff__User__r: {
        Id: "bibbity-bobbity"
      }
    };

    const groups = element.shadowRoot.querySelector("c-groups");
    groups.dispatchEvent(
      new CustomEvent("memberadd", { detail: MEMBER_ADD_EVENT })
    );

    expect(createRecord).toHaveBeenCalledWith({
      apiName: "UserToSoundboardGroup__c",
      fields: {
        SoundboardGroup__c: MEMBER_ADD_EVENT.groupId,
        User__c: MEMBER_ADD_EVENT.dcstuff__User__r.Id
      }
    });
  });

  it("should delete group member when member deleted", async () => {
    const element = await getValidSoundboard();

    const buttonEl = element.shadowRoot.querySelector(".btn-groups");
    buttonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    const MEMBER_DELETE_EVENT = { groupId: "whatever", id: "xyzdeleteme" };

    const groups = element.shadowRoot.querySelector("c-groups");
    groups.dispatchEvent(
      new CustomEvent("memberdelete", { detail: MEMBER_DELETE_EVENT })
    );

    expect(deleteRecord).toHaveBeenCalledWith(MEMBER_DELETE_EVENT.id);
  });

  it("should dispatch soundincoming event when PlayEvent received", async () => {
    const mockSoundIncomingHandler = jest.fn();

    const element = await getValidSoundboard();
    element.addEventListener("soundincoming", mockSoundIncomingHandler);

    expect(subscribe).toHaveBeenCalled();
    expect(subscribe.mock.calls[0][0]).toBe("/event/dcstuff__PlayEvent__e");

    const PLAY_EVENT = {
      data: {
        payload: {
          CreatedById: USER_ID,
          dcstuff__SendToIds__c: "[123]"
        }
      }
    };

    subscribe.mock.calls[0][2](PLAY_EVENT);

    expect(mockSoundIncomingHandler).toHaveBeenCalledTimes(1);
  });

  it("should focus on different things with arrow key presses on focussed tab anchors", async () => {
    const element = await getValidSoundboard();

    const groupsButtonEl = element.shadowRoot.querySelector(".btn-groups");
    const allowlistButtonEl = element.shadowRoot.querySelector(
      ".btn-allowlist"
    );
    const blocklistButtonEl = element.shadowRoot.querySelector(
      ".btn-blocklist"
    );

    groupsButtonEl.dispatchEvent(new Event("click"));

    await Promise.resolve();

    let groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).not.toBeNull();

    let filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).toBeNull();

    groupsButtonEl.focus();

    const RIGHT_ARROW_EVENT = new Event("keydown");
    RIGHT_ARROW_EVENT.keyCode = KEYS.RIGHT_ARROW;

    const LEFT_ARROW_EVENT = new Event("keydown");
    LEFT_ARROW_EVENT.keyCode = KEYS.LEFT_ARROW;

    groupsButtonEl.dispatchEvent(RIGHT_ARROW_EVENT);

    await Promise.resolve();

    groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).toBeNull();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).not.toBeNull();
    expect(filterList.filterType).toBe("Allowlist");

    allowlistButtonEl.dispatchEvent(RIGHT_ARROW_EVENT);

    await Promise.resolve();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList.filterType).toBe("Blocklist");

    blocklistButtonEl.dispatchEvent(RIGHT_ARROW_EVENT);

    await Promise.resolve();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).toBeNull();

    groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).not.toBeNull();

    groupsButtonEl.dispatchEvent(LEFT_ARROW_EVENT);

    await Promise.resolve();

    groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).toBeNull();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).not.toBeNull();
    expect(filterList.filterType).toBe("Blocklist");

    blocklistButtonEl.dispatchEvent(LEFT_ARROW_EVENT);

    await Promise.resolve();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList.filterType).toBe("Allowlist");

    allowlistButtonEl.dispatchEvent(LEFT_ARROW_EVENT);

    await Promise.resolve();

    filterList = element.shadowRoot.querySelector("c-filter-list");
    expect(filterList).toBeNull();

    groups = element.shadowRoot.querySelector("c-groups");
    expect(groups).not.toBeNull();
  });

  it("should navigate around the sounds using the keyboard", () => {
    const event = {
      currentTarget: {
        dataset: {}
      }
    };

    event.currentTarget.dataset.index = 0;
    event.keyCode = KEYS.RIGHT_ARROW;
    let index = getSoundIndex(event, new Array(18));
    expect(index).toBe(1);

    event.currentTarget.dataset.index = 17;
    event.keyCode = KEYS.RIGHT_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(0);

    event.currentTarget.dataset.index = 0;
    event.keyCode = KEYS.LEFT_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(17);

    event.currentTarget.dataset.index = 17;
    event.keyCode = KEYS.LEFT_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(16);

    event.currentTarget.dataset.index = 0;
    event.keyCode = KEYS.UP_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(15);

    event.currentTarget.dataset.index = 5;
    event.keyCode = KEYS.UP_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(2);

    event.currentTarget.dataset.index = 0;
    event.keyCode = KEYS.DOWN_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(3);

    event.currentTarget.dataset.index = 17;
    event.keyCode = KEYS.DOWN_ARROW;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(2);

    event.currentTarget.dataset.index = 3;
    event.keyCode = KEYS.HOME;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(3);

    event.currentTarget.dataset.index = 4;
    event.keyCode = KEYS.HOME;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(3);

    event.currentTarget.dataset.index = 5;
    event.keyCode = KEYS.HOME;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(3);

    event.ctrlKey = true;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(0);
    event.ctrlKey = false;

    event.currentTarget.dataset.index = 3;
    event.keyCode = KEYS.END;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(5);

    event.currentTarget.dataset.index = 4;
    event.keyCode = KEYS.END;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(5);

    event.currentTarget.dataset.index = 5;
    event.keyCode = KEYS.END;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(5);

    event.ctrlKey = true;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(17);
    event.ctrlKey = false;

    event.currentTarget.dataset.index = 0;
    event.keyCode = KEYS.SPACE;
    index = getSoundIndex(event, new Array(18));
    expect(index).toBe(-1);
  });
});

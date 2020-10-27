/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Sound from "c/sound";

describe("c-sound", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("populates the image src with the passed in argument", () => {
    const element = createElement("c-sound", {
      is: Sound
    });
    element.sound = { image: "http://www.blah.com/blah.jpg" };
    document.body.appendChild(element);

    const image = element.shadowRoot.querySelector("img");
    expect(image.src).toBe(element.sound.image);
  });

  it("fires soundclicked event when clicked", () => {
    const mockSoundClickedHandler = jest.fn();

    const element = createElement("c-sound", {
      is: Sound
    });

    element.sound = { image: "http://www.blah.com/blah.jpg" };
    element.addEventListener("soundclicked", mockSoundClickedHandler);
    document.body.appendChild(element);

    const buttonEl = element.shadowRoot.querySelector("button");
    buttonEl.click();

    expect(mockSoundClickedHandler).toHaveBeenCalledTimes(1);

    const soundClickedEvent = mockSoundClickedHandler.mock.calls[0][0];
    expect(soundClickedEvent.detail).toBe(element.sound);
  });

  it("toggles the zoom class on hover/blur", async () => {
    const element = createElement("c-sound", {
      is: Sound
    });

    element.sound = { image: "http://www.blah.com/blah.jpg" };
    document.body.appendChild(element);

    let img = element.shadowRoot.querySelector("img");
    expect(img.classList.contains("zoom")).toBe(false);

    const buttonEl = element.shadowRoot.querySelector("button");
    buttonEl.focus();
    expect(img.classList.contains("zoom")).toBe(true);

    buttonEl.blur();
    expect(img.classList.contains("zoom")).toBe(false);
  });
});

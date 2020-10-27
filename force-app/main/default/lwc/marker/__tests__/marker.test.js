/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createElement } from "lwc";
import Marker from "c/marker";

describe("c-marker", () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("displays an empty string when sent no text", () => {
    const element = createElement("c-marker", {
      is: Marker
    });
    element.text = "";
    document.body.appendChild(element);

    const richText = element.shadowRoot.querySelector(
      "lightning-formatted-rich-text"
    );
    expect(richText.value).toBe("");
  });

  it("displays the sent text when search term not found", () => {
    const element = createElement("c-marker", {
      is: Marker
    });
    element.text = "baddabing";
    document.body.appendChild(element);

    const richText = element.shadowRoot.querySelector(
      "lightning-formatted-rich-text"
    );
    expect(richText.value).toBe(element.text);
  });

  it("displays the marked up text when search term found", () => {
    const element = createElement("c-marker", {
      is: Marker
    });
    element.text = "blahbaddabingblah";
    element.searchTerm = "blah";
    document.body.appendChild(element);

    const richText = element.shadowRoot.querySelector(
      "lightning-formatted-rich-text"
    );
    expect(richText.value).toBe("<mark>blah</mark>baddabing<mark>blah</mark>");
  });
});

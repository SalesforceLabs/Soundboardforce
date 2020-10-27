/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api } from "lwc";

export default class Marker extends LightningElement {
  @api searchTerm;
  @api text;

  richText = "";

  connectedCallback() {
    if (!this.text) {
      this.richText = "";
      return;
    }

    const lcSearchTerm = this.searchTerm
      ? this.searchTerm.toLowerCase()
      : this.searchTerm;
    const re = new RegExp(`(${this.searchTerm})`, "gi");
    const segments = this.text.split(re);
    segments.forEach(s => {
      this.richText +=
        s.toLowerCase() === lcSearchTerm ? `<mark>${s}</mark>` : s;
    });
  }
}

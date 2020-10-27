/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

({
  /* eslint-disable no-console */
  /* eslint-disable max-nested-callbacks */

  doInit: function(component) {
    var utilityBarAPI = component.find("utilitybar");

    utilityBarAPI
      .getAllUtilityInfo()
      .then(function(response) {
        if (typeof response !== "undefined") {
          utilityBarAPI.getEnclosingUtilityId().then(function() {
            utilityBarAPI
              .setUtilityLabel({
                label: "Soundboardforce"
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .setUtilityIcon({
                icon: "announcement"
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .onUtilityClick({
                eventHandler: function() {
                  component.set("v.isClicked", true);

                  clearInterval(component.interval);
                  utilityBarAPI
                    .setUtilityHighlighted({
                      highlighted: false
                    })
                    .catch(function(e) {
                      console.error(e);
                    });

                  utilityBarAPI
                    .setUtilityLabel({
                      label: "Soundboardforce"
                    })
                    .catch(function(e) {
                      console.error(e);
                    });
                }
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .setPanelHeaderLabel({
                label: "Soundboardforce"
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .setPanelHeaderIcon({
                icon: "announcement"
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .setPanelWidth({
                widthPX: 346
              })
              .catch(function(e) {
                console.error(e);
              });

            utilityBarAPI
              .setPanelHeight({
                heightPX: 480
              })
              .catch(function(e) {
                console.error(e);
              });
          });
        }
      })
      .catch(function(e) {
        console.error(e);
      });
  },

  handleSoundIncoming: function(component) {
    var utilityBarAPI = component.find("utilitybar");
    var HIGHLIGHT_INTERVAL = 400;

    utilityBarAPI.getUtilityInfo().then(function(response) {
      if (!response.utilityVisible) {
        var highlighted = true;

        component.interval = setInterval(
          $A.getCallback(function() {
            utilityBarAPI
              .setUtilityHighlighted({
                highlighted: highlighted
              })
              .catch(function(e) {
                console.error(e);
              });
            highlighted = !highlighted;
          }),
          HIGHLIGHT_INTERVAL
        );

        utilityBarAPI
          .setUtilityLabel({
            label: "Sound received!"
          })
          .catch(function(e) {
            console.error(e);
          });
      }
    });
  }
});

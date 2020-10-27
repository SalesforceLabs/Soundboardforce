/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getSoundIndex = (event, sounds) => {
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

  let index = event.currentTarget.dataset.index;

  /* eslint-disable eqeqeq */

  switch (event.keyCode) {
    case KEYS.LEFT_ARROW:
      index = index == 0 ? sounds.length - 1 : +index - 1;
      break;
    case KEYS.RIGHT_ARROW:
      index = index == sounds.length - 1 ? 0 : +index + 1;
      break;
    case KEYS.UP_ARROW:
      index = index < 3 ? sounds.length - (3 - index) : +index - 3;
      break;
    case KEYS.DOWN_ARROW:
      index =
        index >= sounds.length - 3 ? 3 - (sounds.length - index) : +index + 3;
      break;
    case KEYS.HOME:
      if (event.ctrlKey) {
        index = 0;
      } else {
        if (index % 3 === 2) {
          index = +index - 2;
        } else if (index % 3 === 1) {
          index = +index - 1;
        }
      }
      break;
    case KEYS.END:
      if (event.ctrlKey) {
        index = sounds.length - 1;
      } else {
        if (index % 3 === 0) {
          index = +index + 2;
        } else if (index % 3 === 1) {
          index = +index + 1;
        }
      }
      break;
    default:
      index = -1;
  }

  return index;
};

export { getSoundIndex };

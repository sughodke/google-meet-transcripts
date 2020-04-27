console.log('stenographer loaded');

try {
  
;(() => {
  const debounce = (func, delay) => {
    let inDebounce
    return function() {
      const context = this
      const args = arguments
      clearTimeout(inDebounce)
      inDebounce = setTimeout(() => func.apply(context, args), delay)
    }
  }

  // find all nodes
  // partition by class
  // for each class, compute lowest common ancescestor
  // check that it is the lowest common ancestor for rest of class
  // check that span is sibling of node leaf has text
  // check if it's centered
  // check if it starts in the bottom left corner and ends between 40-90% over

  // SVGs
  const gridPathD = 'M312 384h16a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm64 0h16a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-256 0h16a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm360-192h-32v-82.73a32.07 32.07 0 0 0-9.38-22.65L361.38 9.38A32 32 0 0 0 338.75 0H112a48 48 0 0 0-48 48v144H32a32 32 0 0 0-32 32v64a32 32 0 0 0 32 32v128a64 64 0 0 0 64 64h320a64 64 0 0 0 64-64V320a32 32 0 0 0 32-32v-64a32 32 0 0 0-32-32zM352 45.25L402.75 96H352zM96 48a16 16 0 0 1 16-16h208v64a32 32 0 0 0 32 32h64v64h-50.75a32 32 0 0 0-22.62 9.37l-13.26 13.26a32 32 0 0 1-22.62 9.37h-101.5a32 32 0 0 1-22.62-9.37l-13.26-13.26a32 32 0 0 0-22.62-9.37H96zm352 400a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V320h384zm32-160H32v-64h114.75L160 237.25A63.58 63.58 0 0 0 205.25 256h101.5A63.58 63.58 0 0 0 352 237.25L365.25 224H480zM144 440a8 8 0 0 0 8 8h208a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H152a8 8 0 0 0-8 8zm40-56h16a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm64 0h16a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8h-16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8z';

  let weTurnedCaptionsOn = false;

  const turnCaptionsOn = () => {
    const $turnCaptionsOn = document.evaluate(`//div[text()='Turn on captions']/ancestor::div[@role='button']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
    if ($turnCaptionsOn) {
      $turnCaptionsOn.click();
      weTurnedCaptionsOn = true;
    }
  }

  const turnCaptionsOff = () => {
    const $turnCaptionsOff = document.evaluate(`//div[text()='Turn off captions']/ancestor::div[@role='button']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

    if ($turnCaptionsOff) {
      $turnCaptionsOff.click();
      weTurnedCaptionsOn = false;
    }
  }

  // Create the styles we need
  const s = document.createElement('style')
  s.innerText = `
    .__gmgv-button {
      overflow: visible !important;
    }
    .__gmgv-button > div {
      box-sizing: border-box;
      display: none;
      position: absolute;
      top: 40px;
      left: 0;
      width: 300px;
      padding: 12px;
      background: white;
      border-radius: 0 0 0 8px;
      text-align: left;
      cursor: auto;
    }
    .__gmgv-button:hover > div {
      display: block;
    }
    .__gmgv-button > div label {
      display: block;
      line-height: 24px;
      cursor: pointer;
    }
  `
  document.body.append(s)

  // Variables
  let closedCaptionsAttachInterval = null;
  let container = null;
  let toggleButtonSVG = null;
  let hideCaptionsWhileRecording = localStorage.getItem('gmgv-show-only-video') === 'true';

  const observer = new MutationObserver((mutations) => {
    try {
      // console.log('mutations', mutations);

      for (let mutation of mutations) {
        if (mutation.target === container) {
          console.log('target is container');

          for (let node of mutation.addedNodes) {
            updateDiv(node);
          }

          // for (let node of mutation.removedNodes) {
          //   updateDiv(node);
          // }
        } else {
          const addedSpans = Array.from(mutation.addedNodes).filter((node) => {
            return node.nodeName === 'SPAN' && node.children && node.children.length === 0;
          });

          const removedSpans = Array.from(mutation.removedNodes).filter((node) => {
            return node.nodeName === 'SPAN' && node.children && node.children.length === 0;
          });

          if (addedSpans.length > 0 || removedSpans.length > 0) {
            let node = mutation.target;

            while (node && node.parentNode !== container) {
              node = node.parentNode;
            }

            if (!node) {
              console.log('could not find root for', mutation.target);
              continue;
            }

            updateDiv(node);
          }
        }
      }
    } catch (e) {
      console.log('error executing observer', e);
    }
  });

  const CACHE = [];

  const getDivData = (node) => {
    console.time('div data');
    const image = node.querySelector('img');
    const person = document.evaluate('.//div/text()', node, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
    const spans = Array.from(node.querySelectorAll('span')).filter((span) => span.children.length === 0);
    const text = spans.map((span) => span.textContent).join(' ');
    console.timeEnd('div data');

    console.log(`${person.textContent}: ${text}`);

    return {
      image,
      person: person.textContent,
      text,
    };
  };

  const updateDiv = (node) => {
    const index = CACHE.findIndex((el) => el.node === node);

    if (index === -1) {
      CACHE.unshift({
        ...getDivData(node),
        startedAt: new Date(),
        endedAt: new Date(),
        node,
        count: 0,
        pollCount: 0,
      });
    } else {
      const cache = CACHE[index];

      if (cache.debounce) {
        clearInterval(cache.debounce);
      }

      cache.count += 1;
      cache.endedAt = new Date();

      cache.debounce = setInterval(() => {
        cache.text = getDivData(node).text;
        console.log('count', cache.count, 'polls', cache.pollCount);
        clearInterval(cache.debounce);
        clearInterval(cache.poll);
        delete cache.poll;
      }, 1000);

      if (!('poll' in cache)) {
        cache.poll = setInterval(() => {
          console.log('x');
          cache.pollCount += 1;
          cache.text = getDivData(node).text;
          console.log('count', cache.count, 'polls', cache.pollCount);
        }, 500);
      }
    }
  };

  // hangout
  //    session
  //        person instance
  //            {removed beginning}
  //            instructions
  //        person instance
  //            {removed beginning}
  //            instructions
  //    session
  //        person instance

  const findContainer = () => {
    observer.disconnect();

    const nodesByClass = {};

    const nodes = Array.from(document.querySelectorAll('img')).filter((node) => {
        return node.src.match(/\.googleusercontent\.com\//);
    });

    for (let node of nodes) {
      if (!(node.clasName in nodesByClass)) {
        nodesByClass[node.className] = [];
      }

      nodesByClass[node.className].push(node);
    }

    const candidates = [];

    for (let classNodes of Object.values(nodesByClass)) {
      let matches = 0;

      for (let node of classNodes) {
        const spans = document.evaluate(`..//span`, node.parentElement, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);

        let span;

        while (span = spans.iterateNext()) {
          if (span.children.length === 0 && span.textContent.length > 3) {
            matches += 1;
            break;
          }
        }
      }

      if (matches !== classNodes.length) {
        continue;
      }

      let candidate = null;

      if (classNodes.length >= 2) {
        const nodeCopy = [...classNodes];
        let current = null;
        let noSharedCommonAncestor = false;

        do {
          for (let i in nodeCopy) {
            if (!nodeCopy[i].parent) {
              noSharedCommonAncestor = true;
              break;
            }

            nodeCopy[i] = nodeCopy[i].parent;

            if (i === 0) {
              current = nodeCopy[i];
            } else if (current && current !== nodeCopy[i]) {
              current = null;
            }
          }
        } while (current === null && noSharedCommonAncestor === false);

        candidate = current;

      } else {
        let node = classNodes[0];

        while (candidate === null && node) {
          if (node.getAttribute('jscontroller')) {
            candidate = node;
          } else {
            node = node.parentNode;
          }
        }
      }

      if (candidate) {
        const windowWidth = window.innerWidth;

        const rect = candidate.children[0].getBoundingClientRect();
        const isCentered = Math.abs(rect.x - rect.left) < 10;
        const isThreeFifthsWidth = Math.abs((rect.x + rect.left)*3/2 - rect.width) < 10;

        const isLeftAligned = rect.left < (windowWidth * .2);
        const isNotRightAligned = rect.right < (windowWidth * .9);
        const isWiderThanHalf = rect.right > (windowWidth * .5);

        // console.log({
        //   className: candidate.children[0].className,
        //   windowWidth,
        //   rect,
        //   isCentered,
        //   isThreeFifthsWidth,
        //   isLeftAligned,
        //   isNotRightAligned,
        //   isWiderThanHalf,
        // });

        // could be more precise about location
        // could explore factors that lead one of these situations to be true and then only accept candidates matching the expected case

        if (isCentered && isThreeFifthsWidth ||
            isLeftAligned && isNotRightAligned && isWiderThanHalf) {
          candidates.push(candidate);
        }
      }
    }

    // return candidates.length === 1 ? candidates[0] : null;
    if (candidates.length === 1) {

      observer.observe(candidates[0], {
        childList: true,
        subtree: true,
        // not employed
        // characterData: true,
        // characterDataOldValue: true,
      });

      try {
        Array.from(candidates[0].children).forEach((child) => {
          updateDiv(child);
         //  handlePersonAddition(candidates[0], child);
        });
      } catch (e) {
        console.log('error handling child node', e);
      }

      return candidates[0];
    }
  }

  const closedCaptionsAttachLoop = () => {
    try {
      container = findContainer();

      if (container) {
        // we've done our job, we can detatch
        // if this is a faulty assumption, we'll need to continually verify we have the correct container
        clearInterval(closedCaptionsAttachInterval);
      }
    } catch (e) {
      console.log('error in loop', e);
    }
  };

  // Define run functions
  const disableGrid = () => {
    try {
      clearInterval(closedCaptionsAttachInterval)
      closedCaptionsAttachInterval = null;
      observer.disconnect();
      toggleButtonSVG.innerHTML = `<path fill="#5f6368" d="${gridPathD}" class="" />`;

      if (weTurnedCaptionsOn) {
        turnCaptionsOff();
        weTurnedCaptionsOn = false;
      }
    } catch (e) {
      console.log('error in disableGrid', e);
    }
  } 
  const enableGrid = () => {
    try {
      if (closedCaptionsAttachInterval) {
        clearInterval(closedCaptionsAttachInterval);
      }

      closedCaptionsAttachInterval = setInterval(closedCaptionsAttachLoop, 1000)
      toggleButtonSVG.innerHTML = `<path fill="#da3025" d="${gridPathD}" class="" />`;
      turnCaptionsOn();
    } catch (e) {
      console.log('error in enableGrid', e);
    }
  }

  let isEnabled = false;

  const toggleGrid = () => {
    isEnabled ? disableGrid() : enableGrid()
    isEnabled = !isEnabled;
  }

  const parents = (node) => {
    const nodes = [node]
    for (; node; node = node.parentNode) {
      nodes.unshift(node);
    }
    return nodes;
  }

  const getCommonAncestor = (node1, node2) => {
    const parents1 = parents(node1);
    const parents2 = parents(node2);
  
    if (parents1[0] === parents2[0]) {
      for (let i = 0; i < parents1.length; i++) {
        if (parents1[i] !== parents2[i]) {
          return parents1[i - 1];
        }
      }
    }
  }

  // Make the button to perform the toggle
  // This runs on a loop since you can join/leave the meeting repeatedly without changing the page
  setInterval(() => {
    try {
      const participantsIcon = `//div[@aria-label='Show participant options']//*[@d='M15 8c0-1.42-.5-2.73-1.33-3.76.42-.14.86-.24 1.33-.24 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.43 0-.84-.09-1.23-.21-.03-.01-.06-.02-.1-.03A5.98 5.98 0 0 0 15 8zm1.66 5.13C18.03 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.58-3.47-6.34-3.87zM9 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 9c-2.7 0-5.8 1.29-6 2.01V18h12v-1c-.2-.71-3.3-2-6-2M9 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 9c2.67 0 8 1.34 8 4v3H1v-3c0-2.66 5.33-4 8-4z']`;
      const chatIcon = `//div[@aria-label='Chat with other participants']//*[@d='M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h16v12z']`;

      const $participantsIcon = document.evaluate(participantsIcon, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
      const $chatIcon = document.evaluate(chatIcon, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

      const $commonAncestor = getCommonAncestor($participantsIcon, $chatIcon);
      // const buttons = $commonAncestor;

      const ownVideoPreview = document.querySelector('[data-fps-request-screencast-cap]')
      let buttons = ownVideoPreview && ownVideoPreview.parentElement.parentElement.parentElement

      // console.log({
      //   '$participantsIcon': $participantsIcon,
      //   '$chatIcon': $chatIcon,
      //   '$commonAncestor': $commonAncestor,
      //   'buttons': buttons,
      // });

      buttons = $commonAncestor;

      if (buttons && !buttons.__grid_ran) {
        buttons.__grid_ran = true

        // Find the button container element and copy the divider
        buttons.prepend(buttons.children[1].cloneNode());

        // Add our button to to enable/disable the grid
        const toggleButton = document.createElement('div')
        toggleButton.classList = buttons.children[1].classList
        toggleButton.classList.add('__gmgv-button')
        toggleButton.style.display = 'flex'
        toggleButton.onclick = toggleGrid
        buttons.prepend(toggleButton)

        toggleButtonSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        toggleButtonSVG.style.width = '24px'
        toggleButtonSVG.style.height = '24px'
        toggleButtonSVG.setAttribute('viewBox', '0 0 512 512')
        toggleButtonSVG.innerHTML = `<path fill="#5f6368" d="${gridPathD}" class="" />`;
        toggleButton.appendChild(toggleButtonSVG)

        // Add checkboxes for all our additional options
        const additionalOptions = document.createElement('div')
        additionalOptions.onclick = e => e.stopPropagation()
        toggleButton.appendChild(additionalOptions)

        const AclearTranscriptL = document.createElement('label')
        AclearTranscriptL.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10px" height="12px" viewBox="0 0 448 512"><path fill="#5f6368" d="M433.941 65.941l-51.882-51.882A48 48 0 0 0 348.118 0H176c-26.51 0-48 21.49-48 48v48H48c-26.51 0-48 21.49-48 48v320c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48v-48h80c26.51 0 48-21.49 48-48V99.882a48 48 0 0 0-14.059-33.941zM352 32.491a15.88 15.88 0 0 1 7.431 4.195l51.882 51.883A15.885 15.885 0 0 1 415.508 96H352V32.491zM288 464c0 8.822-7.178 16-16 16H48c-8.822 0-16-7.178-16-16V144c0-8.822 7.178-16 16-16h80v240c0 26.51 21.49 48 48 48h112v48zm128-96c0 8.822-7.178 16-16 16H176c-8.822 0-16-7.178-16-16V48c0-8.822 7.178-16 16-16h144v72c0 13.2 10.8 24 24 24h72v240z" class="" /></svg> Copy transcript to clipboard';
        additionalOptions.appendChild(AclearTranscriptL)

        const clearTranscriptL = document.createElement('label')
        clearTranscriptL.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 512 512"><path fill="#5f6368" d="M214.951 71.068l-29.543 48.77c-3.425 5.654-10.778 7.473-16.444 4.069l-20.562-12.355c-5.694-3.422-7.525-10.819-4.085-16.501l29.585-48.861c37.33-61.594 126.877-61.579 164.198 0l44.115 72.856 34.93-20.988c12.268-7.371 27.19 3.858 23.765 17.585l-21.886 87.815c-2.137 8.574-10.821 13.792-19.395 11.654l-87.804-21.906c-13.822-3.446-16.55-21.921-4.37-29.239l33.631-20.208-44.045-72.707c-18.636-30.747-63.456-30.73-82.09.016zM55.006 335.104l49.596-81.873 34.03 20.447c12.18 7.318 27.211-3.763 23.765-17.585l-21.88-87.811c-2.137-8.574-10.821-13.792-19.395-11.654l-87.81 21.902c-13.729 3.421-16.638 21.868-4.37 29.239l34.554 20.762-49.475 81.711C-24.729 374.181 21.448 456 96.12 456H164c6.627 0 12-5.373 12-12v-24c0-6.627-5.373-12-12-12H96.045c-37.259 0-60.426-40.907-41.039-72.896zm442.98-24.861l-34.991-57.788c-3.424-5.655-10.778-7.476-16.445-4.071l-20.53 12.336c-5.695 3.422-7.526 10.821-4.083 16.504l35.074 57.897C476.323 366.988 453.337 408 415.96 408H320v-39.98c0-14.21-17.24-21.386-27.313-11.313l-64 63.98c-6.249 6.248-6.249 16.379 0 22.627l64 63.989C302.689 517.308 320 510.3 320 495.989V456h95.887c74.764 0 120.802-81.898 82.099-145.757z" class="" /></svg> Clear Meeting Transcript';
        additionalOptions.appendChild(clearTranscriptL)

        const hideCaptionsWhileRecordingL = document.createElement('label')
        hideCaptionsWhileRecordingL.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15px" height="12px" viewBox="0 0 640 512"><path fill="#5f6368" d="M634 471L36 3.5C29.1-2 19-.9 13.5 6l-10 12.5C-2 25.4-.9 35.5 6 41l58 45.3 41.6 32.5L604 508.5c6.9 5.5 17 4.4 22.5-2.5l10-12.5c5.5-6.9 4.4-17-2.5-22.5zM512 48c8.8 0 16 7.2 16 16v263.2l46.8 36.6c.7-3.8 1.2-7.8 1.2-11.8V64c0-35.3-28.7-64-64-64H128c-5.5 0-10.7.9-15.8 2.2L170.8 48H512zM339.2 377.6L272 428v-60H128c-8.8 0-16-7.2-16-16V184.8l-48-37.5V352c0 35.3 28.7 64 64 64h96v84c0 7.1 5.8 12 12 12 2.4 0 4.9-.7 7.1-2.4L368 416h39.8l-58.6-45.8-10 7.4z" class="" /></svg> Hide Captions While Recording';
        additionalOptions.appendChild(hideCaptionsWhileRecordingL)

        const deleteAllTranscriptsL = document.createElement('label')
        deleteAllTranscriptsL.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 512 512"><path fill="#5f6368" d="M432 192h-16v-82.75c0-8.49-3.37-16.62-9.37-22.63L329.37 9.37c-6-6-14.14-9.37-22.63-9.37H126.48C109.64 0 96 14.33 96 32v160H80c-44.18 0-80 35.82-80 80v96c0 8.84 7.16 16 16 16h480c8.84 0 16-7.16 16-16v-96c0-44.18-35.82-80-80-80zM320 45.25L370.75 96H320V45.25zM128.12 32H288v64c0 17.67 14.33 32 32 32h64v64H128.02l.1-160zM480 352H32v-80c0-26.47 21.53-48 48-48h352c26.47 0 48 21.53 48 48v80zm-80-88c-13.25 0-24 10.74-24 24 0 13.25 10.75 24 24 24s24-10.75 24-24c0-13.26-10.75-24-24-24zM48 504c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-88H48v88zm96 0c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-88h-32v88zm96 0c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-88h-32v88zm96 0c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-88h-32v88zm96 0c0 4.42 3.58 8 8 8h16c4.42 0 8-3.58 8-8v-88h-32v88z" class="" /></svg> Delete all transcripts';
        additionalOptions.appendChild(deleteAllTranscriptsL)

        additionalOptions.appendChild(document.createElement('hr'));
        const list = document.createElement('span');
        list.innerText = 'Foo Bar Baz';
        additionalOptions.appendChild(list);

      }
    } catch (e) {
      console.log('error in interval', e);
    }
  }, 1000);

})();

} catch (e) {
  console.log('init error', e);
}

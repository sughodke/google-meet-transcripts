
try {
  
;(() => {
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
            handlePersonAddition(mutation.target, node);
          }

          for (let node of mutation.removedNodes) {
            handlePersonRemoval(mutation.target, node);
          }
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

            const image = node.querySelector('img');
            const person = document.evaluate('.//div/text()', node, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

            handleSpanAdditionsAndRemovals(image, person, addedSpans, removedSpans, node);
          }
        }
      }
    } catch (e) {
      console.log('error executing observer', e);
    }
  });

  const getRandomInteger = (max = Number.MAX_SAFE_INTEGER) => {
    return Math.floor(Math.random() * Math.floor(max));
  }

  let CACHE = [];

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

  const handlePersonAddition = (target, div) => {
    const image = div.querySelector('img');
    const person = document.evaluate('.//div/text()', div, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

    if (!div.__id) {
      div.__id = getRandomInteger();
    }

    const index = CACHE.findIndex((el) => el.id == div.__id);
    if (index !== -1) {
      console.log('Person has already been added', div.__id);
    } else {
      CACHE.push({ id: div.__id, data: [] });
    }

    const spanResult = document.evaluate('.//span[not(*)]', div, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    let span;
    const spans = [];

    while (span = spanResult.iterateNext()) {
      spans.push(span);
    }

    console.log('<--- begin adding person --->');
    console.log('id', div.__id, 'spans', spans.map((span) => span.textContent), 'div', div);
    handleSpanAdditionsAndRemovals(image, person, spans, [], div);
    console.log('<--- end adding person --->');
  };
  
  const handlePersonRemoval = (target, div) => {
    const image = div.querySelector('img');
    const person = document.evaluate('.//div/text()', div, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

    const index = CACHE.findIndex((el) => el.id == div.__id);

    if (index === -1) {
      console.log('Unrecognized person removed', div.__id, div);
      return;
    }

    CACHE = [...CACHE.slice(0, index), ...CACHE.slice(index+1)];
  };

  const handleSpanAdditionsAndRemovals = (image, person, addedSpans, removedSpans, div) => {
    const key = CACHE.findIndex((el) => el.id == div.__id);

    if (key === -1) {
      console.log('Unrecognized person adjusted', div.__id, CACHE.map((el) => el.id), div);
      return;
    }

    try {
      for (let span of removedSpans) {
        const index = CACHE[key].data.indexOf(span);
        if (index !== -1) {
          CACHE[key].data = [...CACHE[key].data.slice(0, index), ...CACHE[key].data.slice(index+1)];
          console.log(`removed index #${index} "${span.textContent}"`, CACHE[key].data.map((el) => el.textContent));
        } else {
          console.log(`removed unrecognized span "${span.textContent}"`, CACHE[key].data.map((el) => el.textContent));
        }
      }

      let $parentDiv;
      let $addedChild;

      for (let span of addedSpans) {
        if (!$parentDiv) {
          $parentDiv = span;

          while ($parentDiv && $parentDiv.nodeName !== 'DIV') {
            $addedChild = $parentDiv;
            $parentDiv = $parentDiv.parentNode;
          }
        }

        // assert parentDiv is found
        
        const existingIndex = CACHE[key].data.indexOf(span);

        if (existingIndex !== -1) {
          console.log(`span already in cache #${existingIndex} "${span.textContent}"`, CACHE[key].data.map((el) => el.textContent));
        } else {
          const childIndex = Array.from($parentDiv.childNodes).indexOf($addedChild);
          CACHE[key].data = [...CACHE[key].data.slice(0, childIndex), span, ...CACHE[key].data.slice(childIndex)];
          console.log(`added index #${childIndex} "${span.textContent}"`, CACHE[key].data.map((el) => el.textContent));
        }
      }
    } catch (e) {
      console.log('error handling addition/removal', e);
    }
  };

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
        candidates[0].childNodes.forEach((child) => {
          handlePersonAddition(candidates[0], child);
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

        const copyToClipboardL = document.createElement('label')
        const copyToClipboardI = document.createElement('input')
        copyToClipboardI.type = 'checkbox'
        copyToClipboardI.onclick = e => {}
        copyToClipboardL.innerText = 'Hide Captions While Recording';
        copyToClipboardL.prepend(copyToClipboardI)
        additionalOptions.appendChild(copyToClipboardL)

        const clearTranscriptL = document.createElement('label')
        const clearTranscriptI = document.createElement('input')
        clearTranscriptI.type = 'checkbox'
        clearTranscriptI.onclick = e => {}
        clearTranscriptL.innerText = 'Hide Captions While Recording';
        clearTranscriptL.prepend(clearTranscriptI)
        additionalOptions.appendChild(clearTranscriptL)

        const hideCaptionsWhileRecordingL = document.createElement('label')
        const hideCaptionsWhileRecordingI = document.createElement('input')
        hideCaptionsWhileRecordingI.type = 'checkbox'
        hideCaptionsWhileRecordingI.checked = hideCaptionsWhileRecording
        hideCaptionsWhileRecordingI.onchange = e => {
          hideCaptionsWhileRecording = e.target.checked
          localStorage.setItem('gmgv-show-only-video', hideCaptionsWhileRecording)
        }
        hideCaptionsWhileRecordingL.innerText = 'Hide Captions While Recording';
        hideCaptionsWhileRecordingL.prepend(hideCaptionsWhileRecordingI)
        additionalOptions.appendChild(hideCaptionsWhileRecordingL)

        const deleteAllTranscriptsL = document.createElement('label')
        const deleteAllTranscriptsI = document.createElement('input')
        deleteAllTranscriptsI.type = 'checkbox'
        deleteAllTranscriptsI.onclick = e => {}
        deleteAllTranscriptsL.innerText = 'Hide Captions While Recording';
        deleteAllTranscriptsL.prepend(deleteAllTranscriptsI)
        additionalOptions.appendChild(deleteAllTranscriptsL)

      }
    } catch (e) {
      console.log('error in interval', e);
    }
  }, 1000);

})();

} catch (e) {
  console.log('init error', e);
}

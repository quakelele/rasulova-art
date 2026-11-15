# Lenis section navigation

Request: use Lenis and compose whole sections inside the screen instead of
resting between fragments of adjacent sections. Preserve the existing artwork,
palette, navigation, selection, and sole active hero animation.

## Implementation

- Lenis 1.3.27 owns desktop smooth scrolling and modal locking. Mobile section
  and anchor transitions use browser-native smooth scrolling so they can run on
  the compositor; Lenis follows native position and dimensions. The old
  ScrollCraft mount and separate hero exit controller are no longer run.
- The hero remains an interactive frame sequence. Its last frame completes at
  the end of the pin and triggers one smooth transfer to the statement. Input
  is clamped to the film while scrubbing, and the remainder of its gesture cannot
  cascade through later chapters. Upward input can return and scrub backward.
- Mouse wheel and trackpad gestures advance to the adjacent section. A gesture
  tail is debounced, and reverse input can interrupt the transfer. Keyboard
  navigation, Home, End, and pointer interruption are handled separately.
- Screen sections use the dynamic viewport minus the fixed header. Gallery
  images flex to the available space; duplicate gallery thumbnails are removed.
  The category navigation belongs inside the collection's screen.
- A vertical touch gesture outside the film and tall content advances exactly
  one section. Gesture direction is locked after 8 px of travel;
  a deliberate swipe of at least 32 px commits on release, without browser fling
  momentum skipping screens. Horizontal gestures remain with Swiper. The film
  uses bounded passive touch scrubbing, while tall content, desktop nested
  panels, the mobile form, and multi-touch gestures remain native.
- The selection desk can scroll internally on desktop. On mobile it has natural
  height and uses the page's native vertical scrolling, including gestures from
  the card, buttons, and textarea. No nested panel conceals the bottom actions.
  The contact screen includes the footer where available height permits.
- Dialogs stop Lenis and retain their own native scrolling. Reduced motion
  uses native wheel behavior and instant programmatic positioning.

## Verification

Production build, catalog checks, and the section navigation test pass.
The section test covers desktop, laptop, phone, compact phone, and reduced
motion, including gesture tails, reverse movement, anchors, and modal locking.
Hero tests cover all frames through the pin, both directions, native touch,
and horizontal gallery swipes. Additional checks cover eight selected works,
language changes, the mobile menu, hash reload, reload to the hero, and Home/End
interrupting an in-progress transition.

Screenshots and reports: `artifacts/qa/lenis/`, `artifacts/qa/hero-exit/`.
Desktop, laptop, tablet, standard phone, and compact phone compositions were
inspected. The original overflowing atelier grid was fixed with an explicitly
bounded grid column; the final captures show all visible gallery items.

This is browser emulation in installed Chrome, not validation on a physical
iPhone or Safari. No publishing or deployment was performed.

## Mobile viewport jitter follow-up

A changing viewport during a section animation reproduced a 353 px landing
error. Twelve redundant resize events also reset the hero canvas 24 times
without changing either dimension. Evidence: `artifacts/qa/mobile-jank/`.

The page now commits viewport-height changes once scrolling/gestures settle,
then preserves the destination section or reading position. The short-viewport
layout switches at the same time; it no longer flips during browser chrome
movement. Canvas dimensions are assigned only when they change, with an
immediate redraw after a real resize. Image-triggered AOS refreshes are batched,
and blanket layer promotion for offscreen AOS elements was removed.

The reproduction now reports zero landing error and zero redundant canvas
resets. `npm run test:mobile-layout` retains this regression check.

## Mobile UX and rendering follow-up

The mobile selection panel's internal scrolling was removed after real-user
feedback. `npm run test:inquiry-mobile` checks dragging from inside the form,
reaching WhatsApp/copy actions, and continuing to contacts on two phone sizes.

Section gesture ownership now uses CSS `touch-action` and a passive touchmove
listener instead of a blocking document-level listener. Coarse-pointer/narrow
layouts no longer run overlapping AOS entrances. The hero's drawing pauses when
its actual window is outside the visible area below the header.

The mobile native smooth-scroll path preserves adjacent-section gestures,
reverse navigation, anchors, pointer interruption, and viewport corrections.
Chrome emulation with 4x CPU throttling recorded a 175 ms maximum JS frame
interval in the archive before these changes and no interval above 34 ms there
afterwards. One first-entry raster/paint stall remained in the atelier sample.
These measurements are not real-device FPS or proof of Samsung browser behavior.

`/device-diag.html` provides a minimal native-scroll baseline. `/?scrollDebug=1`
loads an opt-in JS frame-cadence/long-task overlay on the actual page. The overlay
is a separate chunk and is not requested on normal visits. It explicitly labels
JS cadence as distinct from compositor/screen FPS. No deployment was performed.

## Personal choice: exclusive native gesture ownership

The mobile form is now excluded from Lenis input handling and section snapping
regardless of whether its content happens to fit the viewport. A wheel gesture
that starts there retains native ownership through its event tail, even when
the pointer ends up over a neighboring section. Entering the form cancels any
previous smooth transition and clears its pending snap timers. Touch gestures
from the form or its current viewport never schedule a section handoff.
The CSS vertical-pan lock is also released for visible neighboring sections
while the form is being read, so dragging the contact preview below it does not
trap the page at the form's lower edge.

`npm run test:inquiry-runaway` exercises touch and wheel in both directions,
including a larger phone where the form can fit. It checks zero scripted scroll
calls after ordinary form input, no wheel delta amplification, and a stable
position after input ends. The form continues to use document scrolling with
reachable WhatsApp/copy actions, rather than a nested scroll panel.

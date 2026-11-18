---
title: "What Happens When You Step Into Mixed Reality?"
youtubeId: "8GkOoDh8Gn0"
channelTitle: "BrainGab"
channelId: "UCr2nNWdzplK5PhRUv5UazeA"
publishedAt: "2026-07-25T17:00:02Z"
date: "2026-11-18"
tags:
  - "AR & VR"
summary: "Mixed reality bridges physical and virtual worlds by enabling digital objects to interact directly with physical surfaces and spaces in real time. Driven by spatial mapping, sensor fusion, and high-speed processing, this technology differs sharply from static augmented reality overlays and fully isolated virtual reality environments. Hardware platforms are shifting rapidly as legacy systems sunset and advanced headsets establish new standards for spatial computing."
metaDescription: "What is mixed reality? Learn how spatial mapping and advanced headsets blend digital objects with your physical room in real time."
targetQuestion: "what is mixed reality"
duration: "7:57"
viewCount: 191
viewsUpdated: "2026-11-18"
thumbMax: true
isShort: false
recipe: 3
faqs:
  - question: "What is Mixed Reality Portal and do I need it?"
    answer: "Mixed Reality Portal is Microsoft's setup tool for tethered headsets, and Microsoft Learn explains that the company removed it in Windows 11 version 24H2. You only need the app if you run an older headset on Windows 11 version 23H2."
  - question: "What is Mixed Reality Link in Windows 11?"
    answer: "Mixed Reality Link is a background service connecting compatible headsets to Windows. Microsoft Learn documents the removal of the platform in Windows 11 version 24H2, so current systems no longer install or run it."
  - question: "What is mixed reality VR?"
    answer: "Mixed reality VR refers to headsets that blend interactive virtual graphics into a live view of your physical room. Meta Horizon OS Developers explains that digital objects in these setups react to your real surroundings by bouncing off walls and resting on tables."
keyFacts:
  - text: "The Apple Vision Pro provides mixed reality computing using dual micro-OLED displays with 23 million pixels, an Apple R1 real-time sensor processing chip with a 12-millisecond photon-to-photon latency, and an Apple M2 processor."
    source: "Apple's technical specifications"
    url: "https://support.apple.com/en-us/117810"
  - text: "Milgram and Kishino's original classification framework evaluated mixed reality displays across three dimensions: the extent of world knowledge, reproduction fidelity, and the extent of the presence metaphor."
    source: "Frontiers in Virtual Reality"
    url: "https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2021.647997/full"
  - text: "Mixed reality headsets utilize a Passthrough API and spatial anchors to allow developers to build experiences mapped to user-defined flat surfaces and boundaries inside a room."
    source: "Meta for Developers"
    url: "https://developers.meta.com/vr/documentation/native/mr-experience-and-use-cases/"
---

Mixed reality is a computing technology that blends the physical world with interactive digital items. Physical and virtual objects coexist and interact with each other in real time. Unlike static graphical overlays, digital objects in mixed reality behave as if they occupy real physical space.

## How does mixed reality differ from AR and VR?
Mixed reality lets digital and physical items interact dynamically. Virtual reality hides the physical world completely, while basic augmented reality only floats flat graphics over it.

Virtual reality replaces your entire field of view with synthetic graphics. When you put on a virtual reality headset, your living room vanishes. You see only software-generated environments, such as a space station or a simulated training room.

Augmented reality keeps your physical surroundings visible. It places flat graphics, such as notification badges or directional arrows, on transparent lenses. Those graphics do not know where your coffee table sits. They simply float over your view like text on a glass window.

Meta Horizon OS Developers points out that physical and virtual objects coexist and interact in real time. A digital ball does not just hover in your vision. It bounces off your plaster wall, rolls beneath your couch, and disappears behind your coffee table.

[Microsoft](https://learn.microsoft.com/en-us/windows/mixed-reality/discover/mixed-reality) Learn tracks the term mixed reality back to a 1994 research paper by Paul Milgram and Fumio Kishino. Their paper, "A Taxonomy of Mixed Reality Visual Displays," introduced the virtuality continuum. That spectrum spans from totally real environments on one side to totally virtual spaces on the other.

Frontiers in Virtual Reality outlines Milgram and Kishino's classification framework, while Meta Horizon OS Developers describes modern object behavior:

| Technology | Physical World Visibility | Digital Object Interaction | Display Purpose |
| --- | --- | --- | --- |
| Virtual Reality | Fully obscured | Confined to simulated software boundaries | Total immersion in synthetic spaces |
| Augmented Reality | Fully visible | Static overlays without surface awareness | Heads-up alerts and floating information |
| Mixed Reality | Fully visible | Responsive collision with real surfaces | Interactive digital work in physical rooms |

According to Frontiers in Virtual Reality, Milgram and Kishino evaluated displays across three specific dimensions. Those dimensions measured the extent of world knowledge, reproduction fidelity, and the extent of the presence metaphor. Today, that world knowledge enables headsets to calculate how physical room geometry affects digital items.

## Spatial mapping and environmental tracking power mixed reality
Mixed reality works through spatial mapping, depth sensors, and camera arrays that scan physical rooms to anchor interactive digital objects to real surfaces.

A headset must understand its surroundings before placing a digital object. Tiny cameras on the visor continuously capture images of your floor, walls, and furniture. Infrared depth sensors shoot out invisible signals to measure physical distances, and software turns those measurements into a mesh of three-dimensional points.

This process is called spatial mapping. Meta for Developers explains that headsets map flat surfaces using a Passthrough API (software tools displaying live camera feeds of the real room) and spatial anchors (digital markers tying virtual objects to real coordinates). If you hang a virtual clock above your kitchen sink, it remains above that sink every time you return.

Microsoft Learn lists five core technical pillars for modern mixed reality environments:
- Environmental understanding through spatial mapping and digital anchors
- Human input tracking through hand movements and eye gaze
- Spatial audio that matches sound direction to physical locations
- Simultaneous positioning of physical and virtual assets
- Real-time multi-user three-dimensional collaboration

Occlusion occurs when a physical object blocks your line of sight to a digital object. If a virtual dog walks behind your desk chair, the headset hides the dog's body. When software tracks your physical walls accurately, you avoid tripping over furniture while moving around.

Whenever gear tracks physical space, keeping users safe should always come first. When sensors map out obstacles accurately, it prevents nasty stumbles or unexpected bumps while navigating a room.

Sensors also track human biological movements. Eye tracking monitors where your pupils look, allowing the computer to render sharp graphics at your point of focus. Hand tracking interprets your finger pinches and grabs, replacing handheld plastic controllers with direct finger contact.

## What hardware devices run mixed reality today?
Modern mixed reality runs on standalone headsets equipped with pass-through cameras, depth sensors, and specialized processors. These chips calculate room geometry in real time. Hardware makers use pass-through video rather than clear glass. Opaque screens sit in front of your eyes while exterior cameras film your room. The headset projects the feed onto internal displays within milliseconds, blending digital objects into the live stream.

[Apple](https://www.apple.com/)'s technical specifications list dual micro-OLED displays (miniature high-resolution screens) with 23 million pixels for the Apple Vision Pro. The headset pairs an Apple R1 sensor processing chip with an Apple M2 processor. Apple measures a 12-millisecond photon-to-photon latency on that R1 chip. Latency means the delay between reality occurring and graphics appearing on screen.

Microsoft Learn confirms that Microsoft formally deprecated (marked for removal and phased out) Windows Mixed Reality. Microsoft removed the software from Windows 11 starting in version 24H2. Support and security updates on Windows 11 version 23H2 end in November 2026.

Modern mixed reality devices rely on several shared hardware components:
- External high-speed cameras to generate stereoscopic video (three-dimensional video that creates depth by showing separate images to each eye) of physical spaces
- Dedicated sensor processing chips to calculate spatial mapping without system delay
- Micro-displays with high pixel density to make text readable
- Integrated directional speakers that deliver realistic spatial audio

Pass-through video consumes enormous electrical energy, leading to short battery runtimes. Heavy headsets can cause neck fatigue during extended use. Bright sunlight can also overpower infrared depth sensors, degrading tracking accuracy in outdoor spaces.

Phasing out operating updates is always worth keeping an eye on. Without steady software patches, any connected hardware quickly develops security holes that leave your local network vulnerable.

## BrainGab demonstrates how mixed reality objects interact with physical rooms
BrainGab demonstrates mixed reality by contrasting static digital displays against interactive virtual objects that respect physical boundaries, furniture, and real-world clutter.

To illustrate the concept, BrainGab presents the example of a virtual robot standing on a tabletop. In BrainGab's demonstration, the robot does not float awkwardly in mid-air.

Instead, the virtual robot recognizes the flat wooden surface beneath its feet. It walks around a physical coffee mug and hides behind a real lamp.

BrainGab contrasts that interactive experience with standard augmented reality smart glasses. In BrainGab's example of augmented reality, a user looks around a room and sees floating elements.

A calendar floats in mid-air, weather information sits near a window, and navigation arrows rest on the floor. BrainGab notes that those graphics remain flat overlays rather than responsive physical items.

BrainGab also highlights how different industries deploy this spatial understanding. In healthcare, BrainGab points out that surgeons examine floating three-dimensional organ models before performing operations. Medical students practice complex surgical procedures without placing patient lives at risk.

BrainGab explains that industrial maintenance relies on similar principles. In manufacturing facilities, technicians view holographic repair guides projected directly onto broken industrial machinery. BrainGab notes that architects walk inside building models before construction starts, letting clients inspect rooms months before builders arrive.

BrainGab observes that devices must understand the physical environment in real time while rendering photorealistic graphics simultaneously. BrainGab notes that current hardware remains heavy, expensive, and limited by battery capacity.

BrainGab identifies several firms developing wearable spatial computers, naming Microsoft, Meta, Apple, Google, Samsung, Qualcomm, and Magic Leap. BrainGab asks viewers to consider how personal computing evolved over 20 years, noting that mainstream adoption might take 5 years or longer.

Using visual setups for hands-on medical training strikes me as a truly positive step. The technology offers tremendous potential here, especially when it can help people practice critical routines without anyone getting hurt.

## Sources

- [What is mixed reality? - Mixed Reality | Microsoft Learn](https://learn.microsoft.com/en-us/windows/mixed-reality/discover/mixed-reality) — microsoft.com
- [Mixed Reality | A Cloud for Global Good | Microsoft](https://news.microsoft.com/cloudforgood/spotlight/introducing-mixed-reality.html) — microsoft.com
- [Mr experience and use cases](https://developers.meta.com/vr/documentation/unity/mr-experience-and-use-cases/) — meta.com
- [support.apple.com/en-us/117810](https://support.apple.com/en-us/117810) — apple.com
- [Learn more about Mixed Reality support options | Microsoft Learn](https://learn.microsoft.com/en-us/hololens/hololens2-support) — microsoft.com
- [Using SteamVR with Windows Mixed Reality - Enthusiast Guide | Microsoft Learn](https://learn.microsoft.com/en-us/previous-versions/mixed-reality/enthusiast-guide/using-steamvr-with-windows-mixed-reality) — microsoft.com
- [Frontiers | Revisiting Milgram and Kishino's Reality-Virtuality Continuum](https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2021.647997/full) — frontiersin.org
- [231514051 A Taxonomy of Mixed Reality Visual Displays](https://www.researchgate.net/publication/231514051_A_Taxonomy_of_Mixed_Reality_Visual_Displays) — researchgate.net
- [Mr experience and use cases](https://developers.meta.com/vr/documentation/native/mr-experience-and-use-cases/) — meta.com
- [Don't Ignore MIXED REALITY—It Could REPLACE Your SMARTPHONE Sooner Than You Think](https://www.youtube.com/watch?v=8GkOoDh8Gn0) — BrainGab on YouTube

---
title: "Has Unity 2022 Democratized Free Mobile AR Development?"
seoTitled: true
youtubeId: "gpaq5bAjya8"
channelTitle: "Playful Technology"
channelId: "UCF8H7dYHK6AvJF0EVonO3cw"
publishedAt: "2022-06-27T20:06:48Z"
date: "2026-07-13"
tags:
  - "AR & VR"
  - "Coding"
summary: "The increasing accessibility of tools like Unity, ARKit, and ARCore has democratized Augmented Reality (AR) application development, shifting it from a niche expertise to a widespread capability. This evolution allows creators to build sophisticated AR experiences, particularly those leveraging image tracking, with free software and native platform support. The move towards self-contained AR functionality marks a significant step, reducing external dependencies and fostering more stable, integrated applications across mobile devices. This trend underscores a broader movement where advanced tech creation becomes more attainable, driving innovation beyond traditional developer circles."
duration: "32:11"
viewCount: 355322
viewsUpdated: "2026-08-28"
thumbMax: true
isShort: false
revised: true
faqs:
  - question: "What is the primary purpose of Unity Hub in mobile AR development?"
    answer: "Unity Hub acts as a central management tool for Unity projects and editor versions. It allows developers to install different Unity editor versions, manage various projects, and add necessary platform-specific modules like Android or iOS build support, streamlining the setup process."
  - question: "How do ARKit and ARCore differ in mobile AR development?"
    answer: "ARKit and ARCore are native AR libraries provided by Apple and Google, respectively. ARKit is used for developing AR applications on Apple iOS devices (iPhones, iPads), while ARCore is used for Android devices. Both provide core AR functionalities like motion tracking, environmental understanding, and light estimation, but they are platform-specific."
  - question: "Why is it important to specify the physical size of a reference image in Unity AR projects?"
    answer: "Providing the physical dimensions of a reference image, such as a playing card's width and height, helps the AR engine improve detection accuracy and tracking stability. This information allows the system to better understand the scale of the real-world object it's looking for, leading to more precise placement of virtual content."
  - question: "What is a 'prefab' in Unity AR development and how is it used with image tracking?"
    answer: "In Unity, a prefab is a reusable Game Object that can be instantiated in a scene. For image tracking, prefabs are virtual objects (like 2D textures, 3D models, or animations) that are associated with specific reference images. When the AR application detects a tracked image, the corresponding prefab is spawned and positioned on top of that image in the real-world view."
rewrittenAt: "2026-08-17"
---

Mobile Augmented Reality (AR) development involves creating applications that superimpose virtual objects onto a real-world camera feed from a mobile phone or tablet. This process allows digital content to interact with and enhance the user's physical environment, offering experiences ranging from interactive filters to 3D object placement. The increasing availability of powerful, free development tools and native platform support has significantly lowered the barrier to entry for creating sophisticated AR experiences.

## Understanding Mobile Augmented Reality

Augmented Reality enhances the real world by overlaying digital information. Unlike Virtual Reality, which creates an entirely simulated environment, AR integrates virtual elements into a live view of the user's surroundings, typically captured by a mobile device's camera. This technology has diverse applications, from practical tools to entertainment.

Common applications of mobile AR include face and body tracking, where virtual masks or effects are wrapped over detected facial features or body parts, similar to popular social media filters. Another use is environment detection, which identifies horizontal or vertical surfaces in the real world, allowing virtual objects to be placed on floors, walls, or tables at a specific distance from the user.

A particularly versatile form of AR is image tracking. This method detects a specific image or texture within the camera's video feed and uses it as an anchor to position virtual objects. Unlike QR codes or barcodes, which are designed for machine readability, a tracked image can be any visual element, such as a playing card or a printed photograph. For example, an AR application could detect a King of Hearts playing card and replace its texture with a Two of Clubs, or even superimpose a 3D model of a robot onto a simple printout, allowing users to view the virtual object from all angles as they move their device around the physical image.

## Essential Tools: Unity, ARKit, and ARCore

The democratization of mobile AR development is largely due to the evolution of powerful, accessible software. Unity stands out as a leading development platform, offering a comprehensive environment for building AR applications. Its flexibility allows creators to develop for various platforms, including mobile, with a single codebase.

For mobile AR, Unity leverages native AR libraries provided by device manufacturers. For Apple iOS devices like iPhones and iPads, Unity integrates with Apple's ARKit library. For Android devices, it uses Google's ARCore library. This approach ensures that AR applications benefit from the optimized performance and features built directly into the device's operating system, providing a more stable and integrated experience. The use of these native libraries means that the AR functionality is self-contained on the device, eliminating dependencies on third-party components or external websites for managing tracked images, which was a common challenge with older AR development methods. This shift reduces external dependencies, leading to more reliable and efficient applications.

Unity offers a free personal license for individuals, making it an accessible option for independent developers and hobbyists. This, combined with the native support from ARKit and ARCore, means that sophisticated AR experiences can be built using entirely free software.

## Setting Up Your AR Development Environment

To begin mobile AR development with Unity, the first step is to install the Unity Hub. This application acts as a central management tool, allowing developers to install different versions of the Unity editor, manage multiple projects, and add necessary platform-specific modules.

When installing a Unity editor version, it's important to select the appropriate modules for your target mobile platforms. For instance, if you plan to build for Android phones and tablets, you would include Android Build Support, along with the necessary SDK and OpenJDK tools. Similarly, for Apple iPhones or iPads, you would include iOS Build Support. While it's possible to install multiple target platforms, each module requires additional disk space, so it's practical to only install those you intend to use.

Once Unity and the required platform modules are installed, you can create a new project. Unity provides an AR template, which pre-configures many of the settings and includes essential assets needed for an AR application. This template serves as a foundational base, streamlining the initial setup process and allowing developers to quickly move into building their specific AR experiences.

## Configuring Project Settings and Packages

After creating a new AR project in Unity, several project settings need to be reviewed and potentially modified to ensure proper functionality and compatibility.

Within the project settings, the XR Plugin Management section is particularly important. "XR" refers to Extended Reality, encompassing both Augmented and Virtual Reality. Here, you select the specific AR plugin for your target platform – ARCore for Android or ARKit for iOS. It's also advisable to ensure that the XR plugin is initialized on startup and, for applications where AR is central, to require ARCore (or ARKit) on the device. This ensures the application will only run on devices that fully support the necessary AR capabilities.

Other critical settings are found in the Player Settings. These include basic information like the company and application name, which will appear on the device. For graphics, it's recommended to remove older APIs like OpenGL ES 2, which are no longer widely supported. For Android deployment, a minimum API level of 24 is required to support ARCore. The scripting backend should be set to IL2CPP, and it's essential to enable 64-bit builds (ARM 7 and ARM 64) if you intend to publish the app on the Google Play Store. These settings are often pre-configured by the AR template but should always be verified.

Finally, managing project packages is important. Unity projects come with several AR-related packages installed. It's a good practice to use the Package Manager (accessible via the Window menu) to ensure all these packages are updated to their latest recommended versions. Outdated packages can sometimes lead to deployment issues, such as a black screen when running the app on a device.

## Implementing Image Tracking in AR

A newly created AR project in Unity typically includes core components that manage the AR experience. The `AR Session` object handles the overall lifecycle of the AR application, while the `AR Session Origin` acts as an essential link, mapping real-world objects to virtual objects within the scene by providing a common frame of reference. This `AR Session Origin` might be renamed to `XR Session Origin` in future Unity versions to unify AR and VR concepts.

For image tracking, the `AR Session Origin` needs a specific component: the `AR Tracked Image Manager`. This manager is responsible for detecting and tracking images in the real world, allowing virtual content to be positioned accurately on them. The `AR Tracked Image Manager` requires a library of images to look for.

To create this library, you first import your desired images (e.g., JPEG files) into your Unity project's assets. Then, you create a `Reference Image Library` (found under Assets > Create > XR). Into this library, you drag your imported images. Optionally, and often beneficially, you can specify the physical dimensions of each image in meters. For instance, a standard playing card might be specified as 6 centimeters wide and 8.8 centimeters high. Providing these real-world measurements helps the AR engine improve detection accuracy and tracking stability. Once the library is populated, it is then assigned to the `Serialized Reference Image Library` slot in the `AR Tracked Image Manager` component on the `AR Session Origin` object.

## Scripting Custom AR Behaviors

While setting up the `AR Tracked Image Manager` and its reference library enables the app to find and track images, it won't perform any actions until custom behavior is scripted. Unity scripts are written in C#, and they define how virtual objects respond to tracked images.

A common approach involves creating a custom script that listens for events from the `AR Tracked Image Manager`. This manager constantly monitors the camera feed in the background and fires `TrackedImagesChanged` events whenever a new image is detected, an existing one moves, or one leaves the scene.

Within the custom script, you define an array of "Game Objects," which are Unity's fundamental building blocks for everything in a game or application, including characters, props, and environmental elements. These Game Objects are often pre-configured as "prefabs" – reusable assets that can be instantiated in the scene. Each prefab in this array corresponds to an image in the reference library, typically sharing the same name. For example, if your reference library includes an image named "k_hearts," you would have a prefab also named "k_hearts."

When the `TrackedImagesChanged` event fires, the script identifies which image has been detected. It then instantiates the corresponding prefab from its array, positioning it precisely on the tracked image in the real-world view. This prefab could be a simple 2D texture (like replacing one playing card with another), an MP4 animation, or a complex 3D model. The script also manages the lifecycle of these instantiated prefabs, ensuring they appear, move, and disappear correctly as the tracked images enter, move within, or leave the camera's view. This structured approach allows for dynamic and interactive AR experiences where virtual content seamlessly integrates with the physical world through image recognition.

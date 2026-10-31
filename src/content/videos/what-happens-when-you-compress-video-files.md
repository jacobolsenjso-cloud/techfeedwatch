---
title: "What Happens When You Compress Video Files?"
youtubeId: "hnY6CkqsuRM"
channelTitle: "Lex Clips"
channelId: "UCJIfeSCssxSC_Dhc5s7woww"
publishedAt: "2026-05-07T00:37:24Z"
date: "2026-10-15"
tags:
  - "AI Video"
  - "AI & Tech"
summary: "Video compression reduces file sizes by identifying temporal redundancy between frames, removing spatial repetition, and discarding imperceptible visual detail through quantization. While lossless formats preserve pixel perfection for archival use, consumer streaming relies on lossy codecs to shrink raw data by orders of magnitude. Pushing compression too far introduces visible artifacts like macroblocking, ringing, and banding."
metaDescription: "Discover what happens when you compress videos, from motion estimation to quantization and visual artifacts, explaining how codecs reduce file sizes."
targetQuestion: "what happens when i compress videos"
duration: "20:30"
viewCount: 25670
viewsUpdated: "2026-10-31"
thumbMax: true
isShort: false
faqs:
  - question: "What is lossless video compression?"
    answer: "Lossless video compression reduces file sizes without discarding any visual information. According to the Library of Congress, the FFV1 codec cuts raw uncompressed video footprints by 40% to 65% while preserving 100% of original pixel values bit-for-bit."
  - question: "What is AV1 video compression?"
    answer: "AV1 is an open, royalty-free video coding format designed for efficient internet streaming. According to the Alliance for Open Media, AV1 achieves over 30% bitrate reduction compared to VP9 and roughly 50% reduction compared to H.264 at equivalent visual quality."
  - question: "What is lossy video compression?"
    answer: "Lossy video compression permanently discards redundant and less visible image data to achieve dramatic bandwidth savings. According to the Scientific Working Group on Digital Evidence, applying lossy quantization too aggressively introduces visual defects such as macroblocking, banding, and blurring."
---

When you compress a video, an encoder analyzes the media stream to strip out redundant visual information. This process reduces the overall file size so it transfers faster across networks.

The software divides frames into blocks and identifies elements that remain identical over time. It also permanently discards fine textures that human vision struggles to perceive. The resulting file requires significantly less storage while retaining enough perceptual detail to appear clear during normal playback.

## How do codecs remove repetitive data across video frames?

Codecs eliminate redundant data by splitting video into pixel blocks and calculating mathematical predictions across time and space. They transmit only the residual changes rather than every complete image.

Video files exhibit massive amounts of spatial and temporal duplication. Gary J. Sullivan et al. describe this mechanism in their IEEE Transactions on Circuits and Systems for Video Technology paper on HEVC.

They explain that inter-frame motion estimation and motion compensation divide pictures into blocks and search for matching motion vectors between successive frames. The codec then encodes only the residual difference between frames. Instead of storing repeated backgrounds frame after frame, the encoder stores a single reference and tracks how objects shift position.

Spatial redundancy within individual frames undergoes a separate conversion process. According to the Fraunhofer Heinrich-Hertz-Institut technical documentation on H.264/AVC, the Discrete Cosine Transform or integer transform converts spatial pixel residual blocks into frequency-domain coefficients.

This operation separates smooth low-frequency visual structures from sharp high-frequency details. Encoders also streamline color data before spatial transforms begin.

According to Thomas Wiegand et al. in IEEE Transactions on Circuits and Systems for Video Technology, video compression relies on a hybrid architecture operating across distinct stages:
- Inter-picture prediction to eliminate temporal redundancy across consecutive frames
- Transform coding to eliminate spatial redundancy within individual frames
- Quantization to remove visually imperceptible high-frequency frequencies
- Entropy coding using Context-Adaptive Binary Arithmetic Coding or Context-Adaptive Variable-Length Coding to compress the bitstream losslessly

## Quantization discards fine details that human eyes rarely notice

Quantization reduces file sizes by dividing frequency coefficients by scale factors and rounding them, permanently erasing imperceptible high-frequency textures to save data.

This step represents the irreversible, lossy core of video compression. According to the Fraunhofer Heinrich-Hertz-Institut, quantization divides frequency coefficients by a quantization parameter and rounds them to discrete values. By zeroing out subtle variations in complex textures, the encoder drastically simplifies the mathematical payload.

Chroma reduction operates on a similar principle of visual perception. According to ITU-T Recommendation H.264, encoders frequently apply 4:2:0 chroma subsampling before compression. This step halves color resolution horizontally and vertically because the human visual system is substantially less sensitive to chromatic differences than to luminance.

According to ITU-T Recommendation H.264, the final entropy coding stage uses lossless algorithms to complete the pipeline. It packs the quantized residual data and motion vectors into a compact bitstream without incurring additional data loss.

## Does compressing a video always ruin picture quality?

Compressing a video does not always ruin picture quality. Visually lossless techniques preserve perceptual fidelity, while mathematically lossless methods retain every original pixel.

According to the Library of Congress Recommended Formats Statement documentation on FFV1, mathematically lossless compression reduces digital video data footprint by approximately 40% to 65% compared to raw uncompressed video. It accomplishes this while preserving 100% of the original pixel values bit-for-bit. While FFV1 guarantees exact preservation for archival storage, production environments favor perceptual optimization.

High-bitrate mezzanine formats demonstrate how perceptual compression balances quality with manageable storage. According to the Library of Congress digital format evaluation of Apple ProRes 422 HQ, uncompressed 10-bit 1080p video at 29.97 frames per second generates approximately 560 GB per hour.

In contrast, visually lossless compression at 220 Mbps preserves perceptual fidelity. At that rate, it reduces the file size to roughly 97 GB per hour.

Streaming services also optimize distribution using dynamic ladders. According to the [Netflix](https://www.netflix.com/) Technology Blog study on shot-based dynamic optimization, content-adaptive compression ladders reduce required network bandwidth by over 20% to 50% relative to fixed bitrates. This optimization sustains the same target perceptual quality score on the Video Multimethod Assessment Fusion scale.

## Aggressive compression produces macroblocking, banding, and ringing artifacts

Over-compressing video causes visible artifacts. Extreme quantization forces disparate pixel blocks into flat values, smearing gradients and producing sharp edge distortions.

When bitrates drop too low, the encoder fails to preserve the necessary residual data to reconstruct the scene accurately. According to the Scientific Working Group on Digital Evidence standard "Technical Overview of Digital Video Files", lossy video compression discards information to lower bitrates.

When quantization is set too aggressively, this process introduces compression artifacts, including macroblocking, blurring, banding, and ringing. These visual flaws reveal the underlying grid and transform boundaries that are normally invisible.

The visual breakdowns caused by severe data reduction manifest in several distinct patterns:
- Macroblocking: Distinct rectangular pixel blocks appear across moving objects or detailed scenes when bit allocation drops too low.
- Color banding: Smooth gradients in skies or shadows turn into harsh stepped bands due to insufficient bit depth and aggressive chroma quantization.
- Ringing: Ghost-like ripples and halos emerge around sharp, high-contrast outlines due to truncated high-frequency transform coefficients.
- Blurring: Fine surfaces like foliage, hair, and film grain lose texture entirely as high-frequency detail is discarded.

Advanced codecs mitigate these flaws by achieving superior compression efficiency at lower bitrates. According to the Alliance for Open Media specification data, the open AV1 codec achieves more than a 30% bitrate reduction compared to VP9.

It also delivers roughly a 50% bitrate reduction compared to H.264/AVC at equivalent visual quality levels. These efficiency gains help streaming platforms prevent visible distortions during bandwidth constraints. Viewers examining synthetic media often look for these exact distortions when [spotting the difference](/video/spotting-the-difference-between-ai-video-and-real-video) between AI video and real video.

## Lex Clips on how FFmpeg powers modern video compression

Lex Clips explores how [FFmpeg](https://ffmpeg.org/) and open-source infrastructure handle the mathematical transformations, demuxing stages, and hardware decoding fallbacks that govern digital video encoding.

The speakers note that FFmpeg is utilized across more than 90% of all video pipelines. It functions as foundational software for platforms such as YouTube and Netflix.

According to the Lex Clips discussion, users have installed the open-source media player VLC upwards of 6.5 billion times. The software originally emerged from the VideoLAN project during the late 1990s.

The conversation with Lex Clips details the mechanical execution of modern playback, emphasizing that decoders cannot assume hardware acceleration is universally available. The participants in the Lex Clips video observe that nearly 45% of media files cannot be decoded by a GPU.

Consequently, these streams demand software fallback, which forces the CPU to parse containers and execute arithmetic entropy decoding directly. The speakers in the Lex Clips broadcast explain that MP3 reduces audio files by 10 times. In comparison, video encoders shrink raw footage by 100 to 200 times through aggressive perceptual degradation.

The Lex Clips panel points out that each new codec generation yields approximately 30% bitrate reduction for the same quality. However, encoding demands significantly greater computational power. For instance, an encoder can reuse a static cloud across 30 seconds of video background rather than recalculating the sky in every frame.

Lex Clips contributors state that standardized pairings ensure reliable delivery across disparate devices in 99% of everyday consumer playback scenarios. An example includes H.264 video paired with AAC audio inside an MP4 container.

## Sources

- [H264avc overview (PDF)](https://www.cs.ubc.ca/~krasic/cpsc538a/papers/h264avc-overview.pdf) — ubc.ca
- [Advanced Video Coding - Wikipedia](https://en.wikipedia.org/wiki/Advanced_Video_Coding) — wikipedia.org
- [Overview high efficiency video coding hevc standard](https://ieee-cas.org/media/overview-high-efficiency-video-coding-hevc-standard) — ieee-cas.org
- [hevc.hhi.fraunhofer.de](https://hevc.hhi.fraunhofer.de/) — fraunhofer.de
- [Icacsesp10 (PDF)](https://www.warse.org/IJATCSE/static/pdf/file/icacsesp10.pdf) — warse.org
- [H.264 Overview](https://www.hhi.fraunhofer.de/en/departments/vca/technologies-and-solutions/h264-avc/h264-overview.html) — fraunhofer.de
- [ijceronline.com/papers/Vol2_issue2/BH022575579.pdf](https://www.ijceronline.com/papers/Vol2_issue2/BH022575579.pdf) — ijceronline.com
- [Download documents](https://ptacts.uspto.gov/ptacts/public-informations/petitions/1556754/download-documents?artifactId=BSSgGXlg4Y_kKiBrzxCxgmorJ0Uyhowui7i6a5AnQ2EBcDSxNhOu9SE) — uspto.gov
- [2026 07 21 technical overview of digital video files 17 v 001 1 5](https://www.swgde.org/17-v-001-1-5/2026-07-21-technical-overview-of-digital-video-files-17-v-001-1-5/) — swgde.org
- [Apple ProRes 422 High Quality](https://www.loc.gov/preservation/digital/formats/fdd/fdd000403.shtml) — loc.gov
- [FFV1 at the RAC – Part 1: The Rationale - Bits & Bytes](https://blog.rockarch.org/FFV1-at-the-RAC-Part-1-The-Rationale) — rockarch.org
- [AV1 - Wikipedia](https://en.wikipedia.org/wiki/AV1) — wikipedia.org
- [349650510 A Technical Overview of AV1](https://www.researchgate.net/publication/349650510_A_Technical_Overview_of_AV1) — researchgate.net
- [Optimized shot based encodes now streaming 4b9464204830](https://netflixtechblog.com/optimized-shot-based-encodes-now-streaming-4b9464204830) — netflixtechblog.com
- [Netflix Research](https://research.netflix.com/publication/improving-our-video-encodes-for-legacy-devices) — netflix.com
- [How video compression works - VLC lead developer explains | Lex Fridman Podcast](https://www.youtube.com/watch?v=hnY6CkqsuRM) — Lex Clips on YouTube

# Twitch React Queue

Twitch React Queue is a custom build of [twitch-clip-queue](https://github.com/jakemiki/twitch-clip-queue). It extends the original app with enhanced queue management, extra chat commands, and support for more media platforms - making it a versatile tool for creators who want to manage and react to viewer-submitted content in real time. The project aims to add new capabilities while keeping the core experience simple and as close to the original as possible.

### Live demo
- **[GitHub Pages](https://enjoythefun.github.io/twitch-react-queue)**
- **[Vercel](https://twitch-react-queue.vercel.app/)**<sup>(*testing new features here first*)</sup>

<p align="center">
  <img src="https://github.com/user-attachments/assets/465c2081-ddd1-440a-9d78-9ebb87bd07a5" alt="Twitch React Queue Screenshot" width="800"/>
</p>


### Features
*(For an up to date list of changes check out [Releases](https://github.com/EnjoyTheFun/twitch-react-queue/releases))*
- Multi-platform support
  - Twitch clips & VODs
  - YouTube videos & shorts
  - Kick clips
  - Streamable videos
  - TikTok videos & photo reels
  - Twitter/X media - videos, images, posts
  - Instagram posts (EXPERIMENTAL)
  - Reddit video posts
- Advanced queue management - additional Twitch chat commands, import in bulk, import from Discord/Reddit, autoplay options,  filtering & more
- Improved UI/UX
- Modern build system - migrated from the deprecated Create React App build tool to Vite
- Authentication & Privacy - **all data stays local. Nothing is stored on a server! Only requirement is reading permission for twitch chat messages.**

- [More](https://github.com/EnjoyTheFun/twitch-react-queue/releases)

### Contributing
Contributions are welcome! Open an issue or PR if you have ideas, improvements, or bug fixes.

### Notes
*The name "Clip Queue" didn't make sense anymore since the app now supports many media types beyond clips. Because most creators use it for reaction content, "React Queue" felt more fitting. It also distinguishes this custom build from the original project. If you are looking for the clip-only version of Clip Queue, visit the original creator's [repository](https://github.com/jakemiki/twitch-clip-queue).*

### Troubleshooting
Some browser tracker/privacy extensions (for example, Privacy Badger) may block third-party requests used to fetch metadata for TikTok and Streamable links. If clips from these platforms do not queue or appear without thumbnails/titles, try one of the following:

- Whitelist these hosts in your tracker/privacy extension: `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`, `streamable.com`.
- Or disable the extension while using the app

Make sure you've enabled these providers in the app settings first!

*Tested and working on **Firefox** and **Chrome** with default tracking protection (no advanced tracking extensions)!*

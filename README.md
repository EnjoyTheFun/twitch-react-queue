# Twitch React Queue

**Twitch React Queue** is a browser-based media queue for Twitch streamers and content creators. It lets viewers submit clips and other supported media through Twitch chat, while the streamer or their moderators can review, manage, and play the queue in real time.

**Twitch React Queue** is a custom build of [twitch-clip-queue](https://github.com/jakemiki/twitch-clip-queue). It extends the original app with enhanced queue management, extra chat commands, and support for more media platforms. The project aims to add new capabilities while keeping the core experience simple and as close to the original as possible.

### Live demo
- **[GitHub Pages](https://enjoythefun.github.io/twitch-react-queue)**
- **[Vercel](https://twitch-react-queue.vercel.app/)**<sup>(*testing new features here first*)</sup>

<p align="center">
  <img src="https://github.com/user-attachments/assets/465c2081-ddd1-440a-9d78-9ebb87bd07a5" alt="Twitch React Queue Screenshot" width="800"/>
</p>


### Features
*(For an up to date list of changes check out [Releases](https://github.com/EnjoyTheFun/twitch-react-queue/releases))*
- Configurable platform support - choose which media platforms are enabled or disabled
  - Twitch clips & VODs
  - YouTube videos & shorts
  - Kick clips
  - Streamable videos
  - TikTok videos & photo reels
  - X/Twitter videos, images & posts
  - Instagram posts <sup>(EXPERIMENTAL)</sup>
  - Reddit posts <sup>(EXPERIMENTAL)</sup>
- Advanced queue management - additional Twitch chat commands, bulk link import, autoplay options, filtering, and queue export to JSON
- Twitch chat integration - support for Twitch channel point redemption and power-up entries, and configurable handling of messages containing URLs
- Improved UI/UX, message handling, and error handling
- Code quality improvements
- Modern build system - migrated from the deprecated Create React App build tool to Vite
  - Vite offers a modern lightweight development workflow with fast startup and hot module replacement, plus optimized production builds
  - ~75% faster production builds
  - ~80% faster dev-server startup
  - Improved React rendering and state updates, lazy loading and modularization
- Authentication & Privacy - **Twitch React Queue is a client-side application. Queue data, settings, history, and other application data remain in the user's browser and are not stored on a server operated by this project.**

- [More](https://github.com/EnjoyTheFun/twitch-react-queue/releases)

### Contributing
Contributions are welcome! Open an issue or PR if you have ideas, improvements, or bug fixes.

### Notes
*The name "Clip Queue" didn't make sense anymore since the app now supports many media types beyond clips. Because most creators use it for reaction content, "React Queue" felt more fitting. It also distinguishes this custom build from the original project. If you are looking for the clip-only version of Clip Queue, visit the original creator's [repository](https://github.com/jakemiki/twitch-clip-queue).*

### Troubleshooting
Some browser tracker/privacy extensions (for example, Privacy Badger) may block third-party requests used to fetch metadata for TikTok and Streamable submissions. If media from these platforms does not queue or appear without thumbnail/title, try one of the following:

- Whitelist these hosts in your tracker/privacy extension: `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`, `streamable.com`.
- Or disable the extension on the app page

Make sure you've enabled these providers in the app settings first!

*Tested and working on **Firefox** and **Chrome** with default tracking protection (no advanced tracking extensions)!*

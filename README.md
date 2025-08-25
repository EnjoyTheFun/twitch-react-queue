# Twitch React Queue

Twitch React Queue is a custom build of [twitch-clip-queue](https://github.com/jakemiki/twitch-clip-queue). It extends the original app with enhanced queue management, extra chat commands, and support for more media platforms - making it a versatile tool for creators who want to manage and react to viewer-submitted content in real time. The project aims to add new capabilities while keeping the core experience simple and as close to the original as possible.

### Live Demo
**[GitHub Pages (PROD)](https://enjoythefun.github.io/twitch-react-queue) or [Vercel (EXPERIMENTAL)](https://etf-clip-q.vercel.app/)**
<sup>(*new features are tested on Vercel first*)</sup>

### Features
(For an up to date list of changes check out [Releases](https://github.com/EnjoyTheFun/twitch-react-queue/releases))
- Multi-platform support
  - Twitch clips & VODs
  - YouTube videos & shorts
  - Kick clips
  - Streamable videos
  - TikTok videos & photo reels
  - Twitter/X media - videos, images, posts
  - Instagram posts (EXPERIMENTAL)
- Advanced queue management - additional Twitch chat commands, import from Discord/APIs, autoplay options
- UI improvements
- Authentication & Privacy - **unchanged. Most logic still runs client‑side!**
- [More](https://github.com/EnjoyTheFun/twitch-react-queue/releases)

### Contributing
Contributions are welcome! If you have ideas or improvements, feel free to open an issue or PR.

### Notes
*The name "Clip Queue" didn’t make sense anymore since the app now supports many media types beyond clips. Because most creators use it for reaction content, "React Queue" felt more fitting - while also distinguishing this custom build from the original project. If you are looking for a stable version of Clip Queue, visit the original creator's [repository](https://github.com/jakemiki/twitch-clip-queue).*

### Troubleshooting
Some browser tracker/privacy extensions (for example, Privacy Badger) may block third-party requests used to fetch metadata for TikTok and Streamable links. If clips from these platforms do not queue or appear without thumbnails/titles, try one of the following:

- Whitelist these hosts in your tracker/privacy extension: `tiktok.com`, `vm.tiktok.com`, `vt.tiktok.com`, `streamable.com`.
- Or disable the extension while using the app

Make sure you've enabled these providers in the app settings first!

Tested and works correctly on Firefox, Chrome and Brave with default tracking protection (no tracking extensions)!

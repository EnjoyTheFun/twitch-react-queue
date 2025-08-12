import tiktokProvider from './tiktokProvider';

describe('TikTokProvider', () => {
  it('gets clip id from www.TikTok.com url', () => {
    expect(tiktokProvider.getIdFromUrl('https://www.tiktok.com/@scout2015/video/6718335390845095173')).toEqual(
      'l|6718335390845095173'
    );
  });
});

describe('TikTokProvider2', () => {
  it('gets clip id from shortened TikTok url', () => {
    expect(tiktokProvider.getIdFromUrl('https://vm.tiktok.com/ZSQgXd4H/')).toEqual(
      's|ZSQgXd4H'
    );
  });
});

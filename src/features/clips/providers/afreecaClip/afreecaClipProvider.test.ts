import afreecaClipProvider from './afreecaClipProvider';

describe('soopClipProvider', () => {
  it('gets clip info from SOOP', () => {
    expect(afreecaClipProvider.getIdFromUrl('https://vod.afreecatv.com/player/92015748')).toEqual('92015748');
  });

  it('gets clip info from vod.sooplive.co.kr url (new Korean)', () => {
    expect(afreecaClipProvider.getIdFromUrl('https://vod.sooplive.co.kr/player/92015748')).toEqual('92015748');
  });

  it('gets clip info from sooplive.com url (new International)', () => {
    expect(afreecaClipProvider.getIdFromUrl('https://www.sooplive.com/player/92015748')).toEqual('92015748');
  });

  it('gets clip info from sooplive.com /video/ url pattern', () => {
    expect(afreecaClipProvider.getIdFromUrl('https://www.sooplive.com/video/92015748')).toEqual('92015748');
  });
});

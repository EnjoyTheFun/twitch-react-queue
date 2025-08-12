import instagramProvider from './instagramProvider';

describe('InstagramProvider', () => {
  it('gets clip id from www.instagram.com url', () => {
    expect(instagramProvider.getIdFromUrl('https://www.instagram.com/p/B_2rELgpx32/')).toEqual(
      'B_2rELgpx32'
    );
  });
});

describe('InstagramProvider2', () => {
  it('gets clip id from www.instagram.com url', () => {
    expect(instagramProvider.getIdFromUrl('https://www.instagram.com/tv/B_2rELgpx32/')).toEqual(
      'B_2rELgpx32'
    );
  });
});

// describe('InstagramProvider3', () => {
//   it('gets clip id from shortened Instagram url', () => {
//     expect(instagramProvider.getIdFromUrl('https://instagr.am/p/B_2rELgpx32/')).toEqual(
//       'B_2rELgpx32'
//     );
//   });
// });

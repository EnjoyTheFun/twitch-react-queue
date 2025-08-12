import twitterProvider from './twitterProvider';

describe('TwitterProvider', () => {
  it('gets clip id from www.twitter.com url', () => {
    expect(twitterProvider.getIdFromUrl('https://x.com/SonySantaMonica/status/1945196886295535650')).toEqual(
      '1945196886295535650'
    );
  });
});

describe('TwitterProvider2', () => {
  it('gets clip id from www.twitter.com url', () => {
    expect(twitterProvider.getIdFromUrl('https://x.com/geoffkeighley/status/1929894894807716237')).toEqual(
      '1929894894807716237'
    );
  });
});

// describe('TwitterProvider3', () => {
//   it('gets clip id from shortened Twitter url', () => {
//     expect(twitterProvider.getIdFromUrl('https://t.co/1234567890')).toEqual(
//       '1234567890'
//     );
//   });
// });

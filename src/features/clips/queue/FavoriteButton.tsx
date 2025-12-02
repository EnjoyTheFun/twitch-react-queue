import { Button } from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addFavoriteSubmitter, removeFavoriteSubmitter, selectFavoriteSubmitters } from '../../settings/settingsSlice';
import { selectCurrentClip } from '../clipQueueSlice';

function FavoriteButton() {
  const dispatch = useAppDispatch();
  const currentClip = useAppSelector(selectCurrentClip);
  const favoriteSubmitters = useAppSelector(selectFavoriteSubmitters);

  if (!currentClip || !currentClip.submitters || currentClip.submitters.length === 0) {
    return null;
  }

  const submitters = currentClip.submitters.map((s) => s.toLowerCase());
  const isFavorited = submitters.some((s) => favoriteSubmitters.includes(s));

  const handleToggleFavorite = () => {
    submitters.forEach((submitter) => {
      if (isFavorited) {
        dispatch(removeFavoriteSubmitter(submitter));
      } else {
        dispatch(addFavoriteSubmitter(submitter));
      }
    });
  };

  return (
    <Button
      size="xs"
      variant="default"
      px={8}
      onClick={handleToggleFavorite}
      title={isFavorited ? 'Unfavorite submitter' : 'Favorite submitter'}
    >
      {isFavorited ? <IconStarFilled size={16} /> : <IconStar size={16} />}
    </Button>
  );
}

export default FavoriteButton;

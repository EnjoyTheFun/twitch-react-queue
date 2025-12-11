import { PropsWithChildren, ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectQueueClips, currentClipReplaced, queueClipRemoved } from '../clipQueueSlice';
import Clip from '../Clip';
import type { Clip as ClipType } from '../clipQueueSlice';

interface QueueProps {
  card?: boolean;
  wrapper?: (props: PropsWithChildren<{}>) => ReactElement;
  filteredClips?: ClipType[];
}

function Queue({ wrapper, card, filteredClips }: QueueProps) {
  const dispatch = useAppDispatch();
  const allClips = useAppSelector(selectQueueClips);
  const clips = filteredClips ?? allClips;
  const Wrapper = wrapper ?? (({ children }) => <>{children}</>);

  const handleClipClick = (clipId: string) => () => dispatch(currentClipReplaced(clipId));
  const handleClipRemove = (clipId: string) => () => dispatch(queueClipRemoved(clipId));

  return (
    <>
      {clips.map((clip) => (
        <Wrapper key={clip.id}>
          <Clip
            platform={clip.Platform || undefined}
            key={clip.id}
            clipId={clip.id}
            card={card}
            queueIndex={clip.seq}
            onClick={handleClipClick(clip.id)}
            onCrossClick={handleClipRemove(clip.id)}
          />
        </Wrapper>
      ))}
    </>
  );
}

export default Queue;

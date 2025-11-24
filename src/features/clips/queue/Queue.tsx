import { PropsWithChildren, ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectQueueClips, currentClipReplaced, queueClipRemoved } from '../clipQueueSlice';
import Clip from '../Clip';

interface QueueProps {
  card?: boolean;
  wrapper?: (props: PropsWithChildren<{}>) => ReactElement;
}

function Queue({ wrapper, card }: QueueProps) {
  const dispatch = useAppDispatch();
  const clips = useAppSelector(selectQueueClips);
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

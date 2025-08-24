import { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectQueueIds, currentClipReplaced, queueClipRemoved, selectClipById } from '../clipQueueSlice';
import Clip from '../Clip';

interface QueueProps {
  card?: boolean;
  wrapper?: (props: PropsWithChildren<{}>) => JSX.Element;
}

function Queue({ wrapper, card }: QueueProps) {
  const dispatch = useAppDispatch();
  const clipQueueIds = useAppSelector(selectQueueIds);
  const Wrapper = wrapper ?? (({ children }) => <>{children}</>);
  const clips = useAppSelector((state) =>
    clipQueueIds.map((id) => selectClipById(id)(state)).filter((clip) => clip !== undefined)
  );

  const handleClipClick = (clipId: string) => () => dispatch(currentClipReplaced(clipId));
  const handleClipRemove = (clipId: string) => () => dispatch(queueClipRemoved(clipId));

  return (
    <>
      {clips.map((clip, idx) => (
        <Wrapper key={clip!.id}>
          <Clip
            platform={clip!.Platform || undefined}
            key={clip!.id}
            clipId={clip!.id}
            card={card}
            queueIndex={idx + 1}
            onClick={handleClipClick(clip!.id)}
            onCrossClick={handleClipRemove(clip!.id)}
          />
        </Wrapper>
      ))}
    </>
  );
}

export default Queue;

import { cn } from '@/lib/utils';

interface TimelineItem {
  title: string;
  description?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

interface TimelineProps {
  direction?: 'vertical' | 'horizontal';
  items: TimelineItem[];
}

function Timeline({ direction = 'vertical', items }: TimelineProps) {
  return (
    <div
      className={cn('flex flex-col justify-between relative', {
        'flex-row': direction === 'horizontal',
      })}
    >
      {items.map((item, index) => {
        const isLast = index + 1 === items.length;

        return (
          <>
            <div
              className={cn('relative flex w-full', {
                'pb-8': direction === 'vertical',
              })}
            >
              {!isLast && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center ',
                    { 'w-full h-5': direction === 'horizontal' },
                    { 'w-5 h-full': direction === 'vertical' }
                  )}
                >
                  <div
                    className={cn(
                      'bg-black pointer-events-none',
                      { 'h-0.5 w-full': direction === 'horizontal' },
                      { 'w-0.5 h-full': direction === 'vertical' }
                    )}
                  ></div>
                </div>
              )}

              <div
                className={cn(
                  'relative z-10 inline-flex items-center justify-center flex-shrink-0 text-white rounded-full size-5',
                  {
                    'bg-[#7AE1BF] border-2 border-black':
                      item.status === 'COMPLETED',
                  },
                  {
                    'bg-[#FFA38B] border-2 border-black':
                      item.status === 'IN_PROGRESS',
                  },
                  {
                    'border-2 border-black bg-white':
                      item.status === 'NOT_STARTED',
                  }
                )}
              ></div>
              <div
                className={cn(
                  'flex-grow pr-4',
                  { 'pt-6 -ml-4 pr-4': direction === 'horizontal' },
                  { 'pl-4': direction === 'vertical' }
                )}
              >
                <h2 className="mb-1 text-sm font-medium tracking-wider text-gray-900 title-font">
                  {item.title}
                </h2>
                <p className="leading-relaxed">{item.description}</p>
              </div>
            </div>
          </>
        );
      })}
    </div>
  );
}

export { Timeline, type TimelineItem };

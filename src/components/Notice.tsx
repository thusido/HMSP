import { useEffect, useState } from 'react';

export interface NoticeState {
  id: number;
  message: string;
}

/** Non-blocking replacement for window.alert. Auto-dismisses. */
export function Notice({ notice }: { notice: NoticeState | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice || !visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <p className="max-w-2xl rounded-lg bg-gray-900/90 px-4 py-2 text-center text-xs whitespace-pre-line text-white shadow-lg dark:bg-gray-100/90 dark:text-gray-900">
        {notice.message}
      </p>
    </div>
  );
}

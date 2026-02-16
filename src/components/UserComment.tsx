import { useState } from 'react';
import { useChainContext } from '../context/ChainContext';

interface UserCommentProps {
  chainIndex: number;
}

export default function UserComment({ chainIndex }: UserCommentProps) {
  const { links, updateComment } = useChainContext();
  const link = links[chainIndex];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link?.comment || '');

  if (!link) return null;

  const handleSave = () => {
    updateComment(chainIndex, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(link.comment);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="mt-4">
        {link.comment ? (
          <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Your Notes</span>
              <button
                onClick={() => { setDraft(link.comment); setEditing(true); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Edit
              </button>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{link.comment}</p>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-gray-500 hover:text-indigo-400 transition-colors"
          >
            + Add a note about this movie
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write your thoughts about this movie..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

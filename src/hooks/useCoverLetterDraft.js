import { useEffect, useRef, useState } from 'react';

const emptyForm = () => ({ introName: '', introContent: '', desireField: '518' });
const storageError = '이 브라우저에 초안을 저장하지 못했습니다. 페이지를 나가기 전에 내용을 복사하거나 저장해 주세요.';

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { draft: null, message: '' };
    const draft = JSON.parse(raw);
    if (draft.version !== 1 || !['introName', 'introContent', 'desireField'].every(
      field => typeof draft[field] === 'string'
    )) throw new Error('Invalid draft');
    return { draft, message: '' };
  } catch {
    return { draft: null, message: '초안을 불러오지 못했습니다. 새로 작성한 내용은 자동 저장을 다시 시도합니다.' };
  }
}

// The form is keyed by user ID so account changes never reuse another user's state.
export default function useCoverLetterDraft(userId) {
  const key = `dajoba:selfintro:draft:v1:${encodeURIComponent(userId)}:new`;
  const [initial] = useState(() => readDraft(key));
  const [pendingDraft, setPendingDraft] = useState(initial.draft);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(initial.message);
  const latest = useRef(form);
  const dirty = useRef(false);
  const timer = useRef(null);

  function persist(showStatus = true) {
    clearTimeout(timer.current);
    if (!dirty.current) return true;
    try {
      localStorage.setItem(key, JSON.stringify({
        version: 1, ...latest.current, savedAt: new Date().toISOString(),
      }));
      dirty.current = false;
      if (showStatus) setMessage('이 브라우저에 초안이 임시 저장되었습니다.');
      return true;
    } catch {
      if (showStatus) setMessage(storageError);
      return false;
    }
  }

  function update(field, value) {
    if (pendingDraft) return;
    latest.current = { ...latest.current, [field]: value };
    setForm(latest.current);
    dirty.current = true;
    setMessage('초안 저장 대기 중…');
    clearTimeout(timer.current);
    timer.current = setTimeout(persist, 800);
  }

  function restore() {
    const { introName, introContent, desireField } = pendingDraft;
    latest.current = { introName, introContent, desireField };
    setForm(latest.current);
    setPendingDraft(null);
    setMessage('임시 저장한 초안을 불러왔습니다.');
  }

  function discard() {
    try {
      localStorage.removeItem(key);
      setPendingDraft(null);
      setMessage('새 자기소개서를 작성해 주세요.');
    } catch {
      setMessage('초안을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.');
    }
  }

  function complete() {
    clearTimeout(timer.current);
    dirty.current = false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      setMessage('자기소개서는 서버에 저장되었지만, 이 브라우저의 초안은 삭제하지 못했습니다.');
      return false;
    }
  }

  useEffect(() => {
    // Flush the latest input even when leaving before the debounce expires.
    const flush = () => {
      clearTimeout(timer.current);
      if (!dirty.current) return true;
      try {
        localStorage.setItem(key, JSON.stringify({
          version: 1, ...latest.current, savedAt: new Date().toISOString(),
        }));
        dirty.current = false;
        return true;
      } catch {
        return false;
      }
    };
    const beforeUnload = event => {
      if (!flush()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
      flush();
    };
  }, [key]);

  return { form, pendingDraft, message, update, restore, discard, persist, complete };
}

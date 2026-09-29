import React, { useRef, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../Config';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useCoverLetterDraft from '../hooks/useCoverLetterDraft';

const Board = () => {
  const user = useSelector(state => state.user.user);
  if (user?.userid == null) return <p role="alert">로그인 후 자기소개서를 작성해 주세요.</p>;
  return <CoverLetterForm key={user.userid} userId={user.userid} />;
};

const CoverLetterForm = ({ userId }) => {
  const draft = useCoverLetterDraft(userId);
  const { introName, introContent, desireField } = draft.form;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedId, setSavedId] = useState(null);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const navigate = useNavigate();

  const categoryNames = {
    "518": "개발",
    "507": "경영·비즈니스",
    "523": "마케팅",
    "511": "디자인",
    "530": "영업",
    "510": "고객서비스·리테일",
    "524": "미디어",
    "513": "엔지니어링·설계",
    "517": "HR",
    "959": "게임 제작",
    "508": "금융",
    "522": "제조·생산",
    "515": "의료·제약·바이오",
    "532": "물류·무역",
    "10057": "식·음료",
    "521": "법률·법진행기관",
    "509": "건설·시설",
    "514": "공공·복지"
    // 나머지 직군들도 여기에 추가
  };

  // 직군(희망분야) 드롭다운 변경 핸들러
  const handleJobChange = (event) => {
    draft.update('desireField', event.target.value);
  };

  const handleTitleChange = (event) => {
    draft.update('introName', event.target.value);
  };

  const handleTextChange = (event) => {
    draft.update('introContent', event.target.value);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (savingRef.current || draft.pendingDraft || savedId !== null) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    draft.persist();
    try {
      // 데이터를 객체로 묶어서 전송
      const postData = new URLSearchParams({
        introName: introName,
        introContent: introContent,
        desireField: desireField,
      });

      // Axios를 사용하여 데이터 전송 (userId를 URL에 포함)
      const response = await axios.post(`${API_BASE_URL}/users/${userId}/selfintro`, postData);
      // A response arriving after navigation must not clear a newer draft.
      if (!mounted.current) return;
      setSavedId(response.data);
      if (draft.complete()) navigate(`/Mycoverletter/${response.data}`);
    } catch (error) {
      if (mounted.current) setSaveError('저장하지 못했습니다. 작성 내용은 유지됩니다. 다시 시도해 주세요.');
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-12" style={{
      paddingTop: '190px'
    }}> 
      <div className="mx-auto w-full max-w-[960px]">
        <p className="mb-3 text-sm text-gray-600">초안은 현재 브라우저에 자동 저장됩니다. 최종 저장은 아래 저장 버튼을 눌러 주세요.</p>
        {draft.pendingDraft && (
          <section aria-label="임시 저장한 초안" className="mb-6 rounded-md bg-purple-50 p-4">
            <p className="mb-3">임시 저장한 자기소개서가 있습니다. 이어서 작성하시겠어요?</p>
            <button type="button" onClick={draft.restore} className="mr-4 rounded bg-purple-500 px-4 py-2 text-white">이어서 작성</button>
            <button type="button" onClick={draft.discard} className="rounded border px-4 py-2">초안 삭제하고 새로 작성</button>
          </section>
        )}
        <p role="status" className="mb-3 text-sm text-gray-600">{saving ? '서버에 저장 중…' : draft.message}</p>
        {saveError && <p role="alert" className="mb-3 text-red-600">{saveError}</p>}
        {savedId !== null && <button type="button" onClick={() => navigate(`/Mycoverletter/${savedId}`)} className="mb-4 underline">저장한 자기소개서 보기</button>}
        <form onSubmit={handleSave}>
          <fieldset disabled={saving || !!draft.pendingDraft || savedId !== null}>
          <div className="mb-6">
            <label htmlFor="desireField" className="mb-3 block text-base font-medium text-[#07074D]">
              직군(희망분야)
            </label>
            <select
              id="desireField"
              name="desireField"
              className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-purple-500 focus:shadow-md"
              value={desireField}
              onChange={handleJobChange}
            >
              {Object.entries(categoryNames).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label htmlFor="introName" className="mb-3 block text-base font-medium text-[#07074D]">
              제목
            </label>
            <input
              type="text"
              id="introName"
              name="introName"
              placeholder="제목을 입력해주세요"
              className="w-full resize-none rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-purple-500 focus:shadow-md"
              value={introName}
              onChange={handleTitleChange}
            />
          </div>
          <div className="mb-5">
            <label htmlFor="introContent" className="mb-3 block text-base font-medium text-[#07074D]">
              자기소개서 작성
            </label>
            <textarea
              rows="20"
              name="introContent"
              id="introContent"
              placeholder="해당 내용을 입력해주세요"
              className="w-full resize-none rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-purple-500 focus:shadow-md"
              value={introContent}
              onChange={handleTextChange}
            ></textarea>
            <div className="text-right mt-2">
              공백 포함 <span className="text-purple-600">{introContent.length}</span> 자
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="hover:shadow-form rounded-md bg-purple-500 py-3 px-8 text-base font-semibold text-white outline-none"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default Board;

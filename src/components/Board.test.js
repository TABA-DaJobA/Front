import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Board from './Board';

let mockUser = { userid: 1 };
const mockNavigate = jest.fn();
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: fn => fn({ user: { user: mockUser } }) }));
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

const key = id => `dajoba:selfintro:draft:v1:${id}:new`;
const seed = (id = 1) => localStorage.setItem(key(id), JSON.stringify({
  version: 1, introName: '지원 동기', introContent: '기존에 작성한 자기소개서', desireField: '511',
}));
const input = value => fireEvent.change(screen.getByLabelText('자기소개서 작성'), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  mockUser = { userid: 1 };
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('debounces edits and restores all fields after remount only when chosen', () => {
  const view = render(<React.StrictMode><Board /></React.StrictMode>);
  fireEvent.change(screen.getByLabelText('제목'), { target: { value: '지원 동기' } });
  fireEvent.change(screen.getByLabelText('직군(희망분야)'), { target: { value: '511' } });
  input('작성');
  act(() => jest.advanceTimersByTime(500));
  input('작성한 내용');
  act(() => jest.advanceTimersByTime(799));
  expect(localStorage.getItem(key(1))).toBeNull();
  act(() => jest.advanceTimersByTime(1));
  expect(JSON.parse(localStorage.getItem(key(1))).introContent).toBe('작성한 내용');
  view.unmount();
  render(<Board />);
  expect(screen.getByLabelText('자기소개서 작성')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '이어서 작성' }));
  expect(screen.getByLabelText('제목')).toHaveValue('지원 동기');
  expect(screen.getByLabelText('직군(희망분야)')).toHaveValue('511');
  expect(screen.getByLabelText('자기소개서 작성')).toHaveValue('작성한 내용');
});

test.each(['beforeunload', 'pagehide', 'unmount'])('flushes latest input on %s before debounce', event => {
  const view = render(<Board />);
  input('마지막 입력');
  if (event === 'unmount') view.unmount();
  else fireEvent(window, new Event(event));
  expect(JSON.parse(localStorage.getItem(key(1))).introContent).toBe('마지막 입력');
});

test('account changes isolate pending drafts and in-memory input', () => {
  const view = render(<Board />);
  input('첫 번째 사용자 내용');
  mockUser = { userid: 2 };
  view.rerender(<Board />);
  expect(screen.getByLabelText('자기소개서 작성')).toHaveValue('');
  expect(screen.queryByText('이어서 작성')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(key(1))).introContent).toBe('첫 번째 사용자 내용');
  expect(localStorage.getItem(key(2))).toBeNull();
});

test('discarding a pending draft starts a blank form without re-saving it', () => {
  seed();
  const view = render(<Board />);
  fireEvent.click(screen.getByText('초안 삭제하고 새로 작성'));
  expect(screen.getByLabelText('자기소개서 작성')).toHaveValue('');
  view.unmount();
  expect(localStorage.getItem(key(1))).toBeNull();
});

test('server failure retains text and draft; retry blocks duplicate submits and clears on success', async () => {
  axios.post.mockRejectedValueOnce(new Error('offline'));
  const view = render(<Board />);
  input('저장할 내용');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '저장' })));
  expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다');
  expect(screen.getByLabelText('자기소개서 작성')).toHaveValue('저장할 내용');
  expect(localStorage.getItem(key(1))).not.toBeNull();
  let resolve;
  axios.post.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  fireEvent.click(screen.getByRole('button', { name: '저장 중…' }));
  expect(axios.post).toHaveBeenCalledTimes(2);
  await act(async () => resolve({ data: 123 }));
  expect(mockNavigate).toHaveBeenCalledWith('/Mycoverletter/123');
  view.unmount();
  act(() => jest.runOnlyPendingTimers());
  expect(localStorage.getItem(key(1))).toBeNull();
});

test('storage write failures show guidance and request an unload warning', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  render(<Board />);
  input('보존할 내용');
  act(() => jest.advanceTimersByTime(800));
  expect(screen.getByRole('status')).toHaveTextContent('초안을 저장하지 못했습니다');
  const event = new Event('beforeunload', { cancelable: true });
  fireEvent(window, event);
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByLabelText('자기소개서 작성')).toHaveValue('보존할 내용');
});

test('malformed storage does not crash the form', () => {
  localStorage.setItem(key(1), '{broken');
  render(<Board />);
  expect(screen.getByRole('status')).toHaveTextContent('초안을 불러오지 못했습니다');
  input('새 내용');
  act(() => jest.advanceTimersByTime(800));
  expect(JSON.parse(localStorage.getItem(key(1))).introContent).toBe('새 내용');
});

test('late server success after leaving does not remove a newer draft or navigate', async () => {
  let resolve;
  axios.post.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const view = render(<Board />);
  input('이전 내용');
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  view.unmount();
  seed();
  await act(async () => resolve({ data: 123 }));
  expect(localStorage.getItem(key(1))).not.toBeNull();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('successful server save with failed draft deletion prevents duplicate server saves', async () => {
  seed();
  render(<Board />);
  fireEvent.click(screen.getByText('이어서 작성'));
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
  axios.post.mockResolvedValueOnce({ data: 123 });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '저장' })));
  expect(screen.getByRole('status')).toHaveTextContent('서버에 저장되었지만');
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  fireEvent.click(screen.getByText('저장한 자기소개서 보기'));
  expect(mockNavigate).toHaveBeenCalledWith('/Mycoverletter/123');
});

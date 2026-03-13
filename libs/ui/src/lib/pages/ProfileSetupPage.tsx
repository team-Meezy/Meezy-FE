'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography } from '../../design';
import { Input } from '../components';
import { setOauthProfile, useErrorStore } from '@org/shop-data';
import { useProfile } from '../../context';

export function ProfileSetupPage() {
  const router = useRouter();
  const { generalError, setGeneralError } = useErrorStore();
  const { refetchProfile } = useProfile();
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!accountId.trim()) {
      setGeneralError('아이디를 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      setGeneralError('이름을 입력해주세요.');
      return;
    }
    if (!password) {
      setGeneralError('비밀번호를 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setGeneralError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await setOauthProfile(
        accountId.trim(),
        name.trim(),
        password
      );
      console.log('Profile Setup Success (ProfileSetupPage):', response);
      await refetchProfile();
      router.push('/main');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      setGeneralError(
        typeof message === 'string' ? message : '프로필 설정에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-black text-white overflow-hidden"
      style={{ backgroundColor: colors.black[100] }}
    >
      <div className="w-full max-w-[500px] px-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-2">
          <h2
            style={{
              color: colors.white[100],
              ...typography.headline.LHeadlineB,
            }}
          >
            프로필 설정
          </h2>
        </div>
        <p
          className="w-full mb-6"
          style={{ color: colors.gray[400], ...typography.body.BodyM }}
        >
          아이디, 이름, 비밀번호를 입력해주세요.
        </p>

        <form className="w-full space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              id="accountId"
              label="아이디"
              placeholder="아이디를 입력해주세요."
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setGeneralError('');
              }}
              error={generalError}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              id="name"
              label="이름"
              placeholder="이름을 입력해주세요."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setGeneralError('');
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Input
              type="password"
              id="password"
              label="비밀번호"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setGeneralError('');
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Input
              type="password"
              id="passwordConfirm"
              label="비밀번호 확인"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setGeneralError('');
              }}
              error={
                generalError === '비밀번호가 일치하지 않습니다.'
                  ? generalError
                  : ''
              }
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-medium disabled:opacity-50"
            style={{
              backgroundColor: colors.primary[500],
              color: colors.white[100],
              ...typography.body.BodyB,
            }}
          >
            {submitting ? '처리 중...' : '완료'}
          </button>
        </form>
      </div>
    </div>
  );
}

import { colors, typography } from '../../../design';
import { useImg } from '../../../hooks/useImg';

export function ProfileImg() {
  const {
    fileInputRef,
    previewUrl,
    handleClickUpload,
    handleImageChange,
    handleDeleteImg,
  } = useImg();

  return (
    <section className="flex justify-between items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 style={{ ...typography.body.BodyB }}>프로필 대표 이미지 지정</h2>
          <p style={{ ...typography.label.labelM, color: colors.gray[400] }}>
            프로필 대표 이미지를 정해주세요! <br />
            최소 512 x 512 크기로 지정해주세요.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            className="px-4 py-2 rounded-md bg-[#FF5C00] hover:bg-[#E55200] transition-colors"
            style={{ ...typography.body.BodyB, color: '#FFFFFF' }}
            onClick={handleClickUpload}
          >
            대표 이미지 업로드
          </button>
          <button
            className="px-4 py-2 rounded-md bg-[#2C2C2E] hover:bg-[#3A3A3C] transition-colors"
            style={{ ...typography.body.BodyB, color: colors.gray[400] }}
            onClick={handleDeleteImg}
          >
            대표 이미지 삭제
          </button>
        </div>
      </div>

      {/* 이미지 미리보기 박스 */}
      <div className="w-24 h-24 rounded-xl bg-[#D9D9D9] flex items-center justify-center overflow-hidden shrink-0">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#D9D9D9]" />
        )}
      </div>
    </section>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { LectureDetail } from '../components/LectureDetail';

export function LectureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return <div>Lecture not found</div>;
  }

  return (
    <LectureDetail 
      lectureId={id} 
      onBack={() => navigate('/lectures')} 
    />
  );
} 
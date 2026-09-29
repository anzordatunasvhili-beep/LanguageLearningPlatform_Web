import { Link, useParams } from 'react-router';
import { Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { pdfService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
function answer(question) {
  const s = question.solution;
  const value = s.answers || s.acceptedAnswers || s.answer || s.optionId;
  const ids = Array.isArray(value) ? value : [value];
  return ids
    .map((id) => question.payload.options?.find((o) => o.id === id)?.text || id)
    .join(' / ');
}
export default function MaterialPage() {
  const { materialId } = useParams();
  const resource = useResource(() => pdfService.get(materialId), [materialId]);
  return (
    <ResourceState resource={resource}>
      {(material) =>
        material ? (
          <div className="page-stack printable-material">
            <div className="print-controls filter-row">
              <Link className="text-link" to="/app/library">
                Back to library
              </Link>
              <Button onClick={() => window.print()}>Print / save PDF</Button>
            </div>
            <PageHeader
              eyebrow="KOTOBA WORKBOOK"
              title={material.title}
              description={
                material.content.instructions ||
                'Complete the exercises, then check the answer sheet.'
              }
            />
            {material.content.questions?.map((q, i) => (
              <Card className="workbook-question" key={i}>
                <h2>
                  {i + 1}. {q.prompt}
                </h2>
                {q.payload.options?.map((option) => (
                  <p key={option.id}>□ {option.text}</p>
                ))}
                {q.payload.tokens && <p>{q.payload.tokens.join(' · ')}</p>}
                <div className="answer-line" />
              </Card>
            ))}
            <section className="workbook-answers">
              <h2>Answer sheet</h2>
              {material.content.questions?.map((q, i) => (
                <p key={i}>
                  <strong>
                    {i + 1}. {answer(q)}
                  </strong>
                  <br />
                  {q.explanation}
                </p>
              ))}
            </section>
          </div>
        ) : (
          <Card>Workbook not found.</Card>
        )
      }
    </ResourceState>
  );
}

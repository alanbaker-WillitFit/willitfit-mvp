import { describe, expect, it } from 'vitest';
import questionEngine from '@/data/question-engine.json';
import { KNOWLEDGE_OBJECTS } from '@/services/knowledge';

describe('Ask WillItFit publication contract', () => {
  it('publishes only explicitly eligible, ready, verified answers', () => {
    expect(KNOWLEDGE_OBJECTS).toHaveLength(7);
    expect(KNOWLEDGE_OBJECTS.map((item) => item.answerObjectId).sort()).toEqual([
      'ANS-0001','ANS-0002','ANS-0003','ANS-0004','ANS-0005','ANS-0008','ANS-0009'
    ]);
  });

  it('keeps every non-verified answer out of public knowledge routes', () => {
    const publicIds = new Set(KNOWLEDGE_OBJECTS.map((item) => item.answerObjectId));
    const leaked = questionEngine.answers.filter((answer) => {
      const evidence = String(answer.Evidence_Status ?? '').trim().toLowerCase();
      return !['verified','validated','approved'].includes(evidence) && publicIds.has(String(answer.Answer_Object_ID));
    });
    expect(leaked).toEqual([]);
  });
});

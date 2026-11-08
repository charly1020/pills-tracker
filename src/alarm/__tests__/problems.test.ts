import { problems } from '../problems';

describe('problems', () => {
  it('is empty when everything is allowed', () => {
    expect(problems({ notifications: true, exactAlarms: true, fullScreen: true })).toEqual([]);
  });

  it('lists every missing permission, most critical first', () => {
    expect(problems({ notifications: false, exactAlarms: false, fullScreen: false })).toEqual([
      'notifications',
      'exactAlarms',
      'fullScreen',
    ]);
  });

  it('reports only the full-screen permission after an update revokes it', () => {
    expect(problems({ notifications: true, exactAlarms: true, fullScreen: false })).toEqual(['fullScreen']);
  });
});

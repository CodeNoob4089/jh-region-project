const SUPPORT_JOBS = ["치유성", "호법성"];

function isSupportJob(job) {
  return SUPPORT_JOBS.includes(job);
}

function getCharacterPower(character) {
  return Number(character?.power || 0);
}

function createEmptyParty(name) {
  return {
    name,
    slots: [null, null, null, null],
    averagePower: 0,
    hasRequiredSupport: false,
  };
}

function calculateAveragePower(slots) {
  const members = slots.filter(Boolean);

  if (members.length === 0) {
    return 0;
  }

  const total = members.reduce((sum, member) => {
    return sum + Number(member.power || 0);
  }, 0);

  return Math.round(total / members.length);
}

function hasSupport(slots) {
  return slots.some((member) => member && isSupportJob(member.job));
}

function attachCharacterInfo(applications = []) {
  return applications
    .map((application) => {
      const character = application.character;

      if (!character) {
        return null;
      }

      return {
        ...character,
        applicationId: application.id,
        applicationUserId: application.user_id,
      };
    })
    .filter(Boolean);
}

export function buildRaidParties(applications = []) {
  const characters = attachCharacterInfo(applications);

  const supports = characters
    .filter((character) => isSupportJob(character.job))
    .sort((a, b) => getCharacterPower(b) - getCharacterPower(a));

  const dealers = characters
    .filter((character) => !isSupportJob(character.job))
    .sort((a, b) => getCharacterPower(b) - getCharacterPower(a));

  const party1 = createEmptyParty("1파티");
  const party2 = createEmptyParty("2파티");

  const parties = [party1, party2];

  // 서포터 먼저 아래쪽부터 배치
  supports.forEach((support, index) => {
    const party = parties[index % 2];
    const targetIndex = 3 - Math.floor(index / 2);

    if (targetIndex >= 0 && targetIndex < 4 && !party.slots[targetIndex]) {
      party.slots[targetIndex] = support;
    }
  });

  // 딜러는 평균 전투력 밸런스를 고려해서 위쪽부터 배치
  dealers.forEach((dealer) => {
    const party1Members = party1.slots.filter(Boolean).length;
    const party2Members = party2.slots.filter(Boolean).length;

    let targetParty = party1;

    if (party1Members >= 4) {
      targetParty = party2;
    } else if (party2Members >= 4) {
      targetParty = party1;
    } else {
      const party1Power = party1.slots
        .filter(Boolean)
        .reduce((sum, member) => sum + Number(member.power || 0), 0);

      const party2Power = party2.slots
        .filter(Boolean)
        .reduce((sum, member) => sum + Number(member.power || 0), 0);

      targetParty = party1Power <= party2Power ? party1 : party2;
    }

    const emptyIndex = targetParty.slots.findIndex((slot) => slot === null);

    if (emptyIndex !== -1) {
      targetParty.slots[emptyIndex] = dealer;
    }
  });

  parties.forEach((party) => {
    party.averagePower = calculateAveragePower(party.slots);
    party.hasRequiredSupport = hasSupport(party.slots);
  });

  return parties;
}
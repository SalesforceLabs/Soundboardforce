/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

@IsTest
class SoundboardUtilities_Test {
  @IsTest
  static void shouldThrowExceptionOnLoadWhenMissingPermissions() {
    User u = Soundboardforce_TestUtils.createStandardUser('blah');
    insert u;

    AuraHandledException auraException;

    Test.startTest();
    System.runAs(u) {
      try {
        SoundboardUtilities.getSoundboard();
      } catch (AuraHandledException e) {
        auraException = e;
      }
    }
    Test.stopTest();

    System.assertNotEquals(
      null,
      auraException,
      'The method should have thrown an AuraHandledException'
    );
  }

  @IsTest
  static void shouldReturnANewSoundboard() {
    User u = Soundboardforce_TestUtils.createStandardUser('blah');
    insert u;

    Soundboardforce_TestUtils.assignPermissions(u);

    SoundboardUtilities.Soundboard sb;

    Test.startTest();
    System.runAs(u) {
      sb = (SoundboardUtilities.Soundboard) SoundboardUtilities.getSoundboard();
    }
    Test.stopTest();

    System.assertNotEquals(null, sb, 'Expected a new soundboard');
  }

  @IsTest
  static void shouldReturnAUsersExistingSoundboardButReinitSendToAndFilters() {
    User u = Soundboardforce_TestUtils.createStandardUser('blah');
    insert u;

    Soundboardforce_TestUtils.assignPermissions(u);

    System.runAs(u) {
      insert new Soundboard__c();
    }

    SoundboardUtilities.Soundboard sb;

    Test.startTest();
    System.runAs(u) {
      sb = (SoundboardUtilities.Soundboard) SoundboardUtilities.getSoundboard();
    }
    Test.stopTest();

    System.assertEquals(
      u.Id,
      sb.s.SendToId__c,
      'Expected a SendToId matching the running user'
    );
  }

  @IsTest
  static void shouldReturnAUsersExistingSoundboardWithFilterLists() {
    User u = Soundboardforce_TestUtils.createStandardUser('blah');
    User u2 = Soundboardforce_TestUtils.createStandardUser('blaaah');
    insert new List<User>{ u, u2 };

    Soundboardforce_TestUtils.assignPermissions(u);

    FilterList__c allowlist;
    FilterList__c blocklist;

    System.runAs(u) {
      Soundboard__c s = new Soundboard__c(SendToId__c = u2.Id);
      insert s;

      allowlist = new FilterList__c(
        Soundboard__c = s.Id,
        Type__c = 'Allowlist'
      );
      blocklist = new FilterList__c(
        Soundboard__c = s.Id,
        Type__c = 'Blocklist'
      );
      insert new List<FilterList__c>{ allowlist, blocklist };

      insert new List<UserToFilterList__c>{
        new UserToFilterList__c(FilterList__c = allowlist.Id, User__c = u2.Id),
        new UserToFilterList__c(FilterList__c = blocklist.Id, User__c = u2.Id)
      };
    }

    SoundboardUtilities.Soundboard sb;

    Test.startTest();
    System.runAs(u) {
      sb = (SoundboardUtilities.Soundboard) SoundboardUtilities.getSoundboard();
    }
    Test.stopTest();

    System.assertEquals(
      u2.Id,
      sb.s.SendToId__c,
      'Expected a SendToId matching the u2 user'
    );
    System.assertEquals(
      u2.LastName,
      sb.sendToName,
      'Expected the sendToName to match u2\'s name (not the band)'
    );
    System.assertEquals(
      allowlist.Id,
      sb.allowlistId,
      'Expected the soundboard\'s allowlist to match the inserted allowlist'
    );
    System.assertEquals(
      blocklist.Id,
      sb.blocklistId,
      'Expected the soundboard\'s blocklist to match the inserted blocklist'
    );
    System.assertEquals(
      u2.Id,
      sb.allowlistUsers[0].User__c,
      'Expected the allowlist user to match u2 (not the band)'
    );
    System.assertEquals(
      u2.Id,
      sb.blocklistUsers[0].User__c,
      'Expected the blocklist user to match u2 (not the band)'
    );
    System.assertEquals(
      allowlist.Id,
      sb.allowlistUsers[0].FilterList__c,
      'Expected the allowlist user\'s FilterList to match the inserted allowlist'
    );
    System.assertEquals(
      blocklist.Id,
      sb.blocklistUsers[0].FilterList__c,
      'Expected the blocklist user\'s FilterList to match the inserted blocklist'
    );
  }

  @IsTest
  static void shouldReturnAUsersExistingSoundboardWithSendToGroup() {
    User u = Soundboardforce_TestUtils.createStandardUser('blah');
    User u2 = Soundboardforce_TestUtils.createStandardUser('blaaah');
    insert new List<User>{ u, u2 };

    Soundboardforce_TestUtils.assignPermissions(u);

    SoundboardGroup__c g;

    System.runAs(u) {
      Soundboard__c s = new Soundboard__c();
      insert s;

      g = new SoundboardGroup__c(Name = 'hey', Soundboard__c = s.Id);
      insert g;

      insert new UserToSoundboardGroup__c(
        SoundboardGroup__c = g.Id,
        User__c = u2.Id
      );

      s.SendToId__c = g.Id;
      update s;
    }

    SoundboardUtilities.Soundboard sb;

    Test.startTest();
    System.runAs(u) {
      sb = (SoundboardUtilities.Soundboard) SoundboardUtilities.getSoundboard();
    }
    Test.stopTest();

    System.assertEquals(
      g.Id,
      sb.s.SendToId__c,
      'Expected a SendToId matching the inserted \'hey\' group Id'
    );
    System.assertEquals(
      g.Name,
      sb.sendToName,
      'Expected a sendToName matching the inserted \'hey\' group Name'
    );
    System.assertEquals(
      g.Id,
      sb.groups[0].g.Id,
      'Expected a group Id matching the inserted \'hey\' group Id'
    );
    System.assertEquals(
      u2.Id,
      sb.groups[0].members[0].User__c,
      'Expected a group member matching u2 (not the band)'
    );
  }

  @IsTest
  static void shouldReturnMatchingUsers() {
    String someName = '~~~blah~~~';

    User u1 = Soundboardforce_TestUtils.createStandardUser('__' + someName);
    User u2 = Soundboardforce_TestUtils.createStandardUser(someName + '__');
    User u3 = Soundboardforce_TestUtils.createStandardUser(someName + '__2');
    insert new List<User>{ u1, u2, u3 };

    Soundboardforce_TestUtils.assignPermissions(new List<User>{ u1, u3 });

    SoundboardGroup__c g;

    System.runAs(u1) {
      Soundboard__c s = new Soundboard__c();
      insert s;

      g = new SoundboardGroup__c(Name = someName + 'g', Soundboard__c = s.Id);
      insert g;
    }

    System.runAs(u3) {
      Soundboard__c s3 = new Soundboard__c();
      insert s3;

      SoundboardGroup__c g3 = new SoundboardGroup__c(
        Name = someName + 'g3',
        Soundboard__c = s3.Id
      );
      insert g3;
    }

    List<dcstuff.SoundboardUtilities.SendToOption> options;

    options = (List<dcstuff.SoundboardUtilities.SendToOption>) SoundboardUtilities.getLookupOptions(
      someName,
      false,
      true
    );
    System.assertEquals(2, options.size(), 'Expected users u1 and u3');
    System.assertEquals(u1.Id, options[0].value, 'Expected test user 1');
    System.assertEquals(u3.Id, options[1].value, 'Expected test user 3');

    System.runAs(u1) {
      options = (List<dcstuff.SoundboardUtilities.SendToOption>) SoundboardUtilities.getLookupOptions(
        someName,
        true,
        true
      );
    }
    System.assertEquals(2, options.size(), 'Expected test user and test group');
    System.assertEquals(u3.Id, options[0].value, 'Expected test user 3');
    System.assertEquals(g.Id, options[1].value, 'Expected test group Id');
    System.assertEquals(g.Name, options[1].label, 'Expected test group Name');
  }

  @IsTest
  static void shouldFirePlayEvent() {
    User u1 = Soundboardforce_TestUtils.createStandardUser('blah');
    User u2 = Soundboardforce_TestUtils.createStandardUser('blaaah');
    insert new List<User>{ u1, u2 };

    Soundboardforce_TestUtils.assignPermissions(u1);

    SoundboardGroup__c g;

    System.runAs(u1) {
      Soundboard__c s = new Soundboard__c();
      insert s;

      g = new SoundboardGroup__c(Soundboard__c = s.Id);
      insert g;

      insert new UserToSoundboardGroup__c(
        User__c = u1.Id,
        SoundboardGroup__c = g.Id
      );
    }

    Boolean isSuccess;

    System.runAs(u1) {
      isSuccess = SoundboardUtilities.sendPlayEvent(
        'blah.mp3',
        'blah',
        g.Id,
        true
      );
    }

    System.assert(isSuccess);

    System.runAs(u2) {
      isSuccess = SoundboardUtilities.sendPlayEvent(
        'blah.mp3',
        'blah',
        g.Id,
        true
      );
    }

    System.assert(!isSuccess);

    // Cannot test LWC subscriber at present as per:
    // https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/platform_events_test_events.htm
  }
}

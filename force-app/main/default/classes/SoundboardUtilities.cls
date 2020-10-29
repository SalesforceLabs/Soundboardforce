/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

public with sharing class SoundboardUtilities {
  @TestVisible
  static final String NAMESPACE_PREFIX = 'dcstuff';
  @TestVisible
  static final String PERMISSION_SET = 'Soundboardforce_User';

  @AuraEnabled
  public static Object getSoundboard() {
    if (!hasPermission()) {
      throw new AuraHandledException('No permiso!');
    }

    Soundboard__c s;
    Soundboard sb;

    try {
      SoundboardGroup__c sbGroup;

      s = [
        SELECT
          AllowsAnonymous__c,
          IsActive__c,
          IsSoundOn__c,
          IsAllowlistEnabled__c,
          IsBlocklistEnabled__c,
          NoMatterWhat__c,
          PlayOwnSounds__c,
          SendAnonymous__c,
          SendToId__c,
          (SELECT Type__c FROM FilterLists__r ORDER BY CreatedDate),
          (SELECT Name FROM SoundboardGroups__r ORDER BY Name, CreatedDate)
        FROM Soundboard__c
        WHERE CreatedById = :UserInfo.getUserId()
        ORDER BY CreatedDate DESC
        LIMIT 1
      ];

      try {
        Id sendToId = (Id) s.SendToId__c;
        Schema.SObjectType objectType = sendToId.getSobjectType();

        if (objectType == User.getSObjectType()) {
          User user = [
            SELECT Name, SmallPhotoUrl
            FROM User
            WHERE Id = :sendToId
          ];
          sb = new Soundboard(s, user);
        } else if (objectType == SoundboardGroup__c.getSObjectType()) {
          sbGroup = [SELECT Name FROM SoundboardGroup__c WHERE Id = :sendToId];
          sb = new Soundboard(s, sbGroup);
        }
      } catch (Exception e) {
        s.SendToId__c = UserInfo.getUserId();
        update s;
        sb = new Soundboard(s);
      }
    } catch (QueryException qe) {
      s = new Soundboard__c(
        AllowsAnonymous__c = false,
        IsActive__c = true,
        IsSoundOn__c = true,
        IsAllowlistEnabled__c = false,
        IsBlocklistEnabled__c = false,
        NoMatterWhat__c = false,
        PlayOwnSounds__c = true,
        SendAnonymous__c = false,
        SendToId__c = UserInfo.getUserId()
      );
      insert s;
      sb = new Soundboard(s);
    }

    FilterList__c allowlist;
    FilterList__c blocklist;

    for (FilterList__c f : s.FilterLists__r) {
      if (allowlist == null && f.Type__c == 'Allowlist') {
        allowlist = f;
      }

      if (blocklist == null && f.Type__c == 'Blocklist') {
        blocklist = f;
      }

      if (allowlist != null && blocklist != null) {
        break;
      }
    }

    List<FilterList__c> filterLists = new List<FilterList__c>();
    if (allowlist == null) {
      allowlist = new FilterList__c(
        Soundboard__c = s.Id,
        Type__c = 'Allowlist'
      );
      filterLists.add(allowlist);
    }

    if (blocklist == null) {
      blocklist = new FilterList__c(
        Soundboard__c = s.Id,
        Type__c = 'Blocklist'
      );
      filterLists.add(blocklist);
    }

    if (!filterLists.isEmpty()) {
      insert filterLists;
    }

    sb.allowlistId = allowlist.Id;
    sb.blocklistId = blocklist.Id;

    for (UserToFilterList__c u : [
      SELECT User__r.Name, User__r.SmallPhotoUrl, FilterList__c
      FROM UserToFilterList__c
      WHERE FilterList__c IN (:allowlist.Id, :blocklist.Id)
      ORDER BY User__r.Name, CreatedDate
    ]) {
      if (u.FilterList__c == allowlist.Id) {
        sb.allowlistUsers.add(u);
      } else {
        sb.blocklistUsers.add(u);
      }
    }

    Map<Id, SoundboardGroup> soundboardGroupMap = new Map<Id, SoundboardGroup>();
    for (SoundboardGroup__c g : s.SoundboardGroups__r) {
      soundboardGroupMap.put(g.Id, new SoundboardGroup(g));
    }

    if (!soundboardGroupMap.isEmpty()) {
      for (UserToSoundboardGroup__c listUser : [
        SELECT User__r.Name, User__r.SmallPhotoUrl, SoundboardGroup__c
        FROM UserToSoundboardGroup__c
        WHERE SoundboardGroup__c IN :soundboardGroupMap.keySet()
        ORDER BY User__r.Name, CreatedDate
      ]) {
        soundboardGroupMap.get(listUser.SoundboardGroup__c)
          .members.add(listUser);
      }
    }
    sb.groups = getSoundboardGroups(s.SoundboardGroups__r);

    return sb;
  }

  static List<SoundboardGroup> getSoundboardGroups(
    List<SoundboardGroup__c> groups
  ) {
    Map<Id, SoundboardGroup> soundboardGroupMap = new Map<Id, SoundboardGroup>();
    for (SoundboardGroup__c g : groups) {
      soundboardGroupMap.put(g.Id, new SoundboardGroup(g));
    }

    if (!soundboardGroupMap.isEmpty()) {
      for (UserToSoundboardGroup__c listUser : [
        SELECT User__r.Name, User__r.SmallPhotoUrl, SoundboardGroup__c
        FROM UserToSoundboardGroup__c
        WHERE SoundboardGroup__c IN :soundboardGroupMap.keySet()
        ORDER BY User__r.Name, CreatedDate
      ]) {
        soundboardGroupMap.get(listUser.SoundboardGroup__c)
          .members.add(listUser);
      }
    }
    return soundboardGroupMap.values();
  }

  @TestVisible
  class Soundboard {
    @AuraEnabled
    public Soundboard__c s { get; private set; }
    @AuraEnabled
    public String sendToName { get; private set; }
    @AuraEnabled
    public String photoUrl { get; private set; }
    @AuraEnabled
    public String allowlistId { get; private set; }
    @AuraEnabled
    public String blocklistId { get; private set; }
    @AuraEnabled
    public List<UserToFilterList__c> allowlistUsers { get; private set; }
    @AuraEnabled
    public List<UserToFilterList__c> blocklistUsers { get; private set; }
    @AuraEnabled
    public List<SoundboardGroup> groups { get; private set; }

    Soundboard(Soundboard__c s, User u) {
      this(s, u.Name, u.SmallPhotoUrl);
    }

    Soundboard(Soundboard__c s, SoundboardGroup__c g) {
      this(s, g.Name, null);
    }

    Soundboard(Soundboard__c s) {
      this(
        s,
        UserInfo.getName(),
        [SELECT SmallPhotoUrl FROM User WHERE Id = :UserInfo.getUserId()]
        .SmallPhotoUrl
      );
    }

    Soundboard(Soundboard__c s, String sendToName, String photoUrl) {
      this.s = s;
      this.sendToName = sendToName;
      this.photoUrl = photoUrl;
      allowlistUsers = new List<UserToFilterList__c>();
      blocklistUsers = new List<UserToFilterList__c>();
    }
  }

  class SoundboardGroup {
    @AuraEnabled
    public SoundboardGroup__c g { get; private set; }
    @AuraEnabled
    public List<UserToSoundboardGroup__c> members { get; private set; }

    SoundboardGroup(SoundboardGroup__c g) {
      this.g = g;
      members = new List<UserToSoundboardGroup__c>();
    }
  }

  static Boolean hasPermission() {
    return ![
        SELECT Id
        FROM PermissionSetAssignment
        WHERE
          AssigneeId = :UserInfo.getUserId()
          AND PermissionSet.Name = :PERMISSION_SET
          AND PermissionSet.NamespacePrefix = :NAMESPACE_PREFIX
      ]
      .isEmpty();
  }

  @AuraEnabled
  public static List<Object> getLookupOptions(
    String searchTerm,
    Boolean searchGroups,
    Boolean skipYourself
  ) {
    String newSearchTerm = '%' + String.escapeSingleQuotes(searchTerm) + '%';
    List<SendToOption> options = new List<SendToOption>();

    for (
      User u : Database.query(
        'SELECT Name, SmallPhotoUrl ' +
        'FROM User ' +
        'WHERE Name LIKE :newSearchTerm ' +
        'AND Id IN ' +
        '(' +
        'SELECT AssigneeId ' +
        'FROM PermissionSetAssignment ' +
        'WHERE PermissionSet.Name = :PERMISSION_SET ' +
        'AND PermissionSet.NamespacePrefix = :NAMESPACE_PREFIX ' +
        ') ' +
        (skipYourself == true
          ? 'AND Id != \'' + UserInfo.getUserId() + '\''
          : '') +
        'ORDER BY Name, CreatedDate'
      )
    ) {
      options.add(new SendToOption(u.Id, u.Name, u.SmallPhotoUrl));
    }

    if (searchGroups) {
      for (SoundboardGroup__c g : [
        SELECT Name
        FROM SoundboardGroup__c
        WHERE
          Soundboard__r.OwnerId = :UserInfo.getUserId()
          AND Name LIKE :newSearchTerm
        ORDER BY Name, CreatedDate
      ]) {
        options.add(new SendToOption(g.Id, g.Name));
      }
    }

    options.sort();
    return options;
  }

  @TestVisible
  class SendToOption implements Comparable {
    @AuraEnabled
    public String value { get; private set; }
    @AuraEnabled
    public String label { get; private set; }
    @AuraEnabled
    public String picture { get; private set; }

    SendToOption(String value, String label) {
      this.value = value;
      this.label = label;
    }

    SendToOption(String value, String label, String picture) {
      this(value, label);
      this.picture = picture;
    }

    public Integer compareTo(Object compareTo) {
      SendToOption compareToOption = (SendToOption) compareTo;

      if (label == compareToOption.label) {
        if (compareToOption.picture == null) {
          return -1;
        }
        return 0;
      }

      if (label > compareToOption.label) {
        return 1;
      }

      return -1;
    }
  }

  @AuraEnabled
  public static Boolean sendPlayEvent(
    String soundUrl,
    String title,
    Id sendToId,
    Boolean isAnonymous
  ) {
    if (!hasPermission()) {
      return false;
    }

    Set<Id> ids;

    if (sendToId.getSobjectType() == SoundboardGroup__c.getSObjectType()) {
      ids = new Map<Id, AggregateResult>(
          [
            SELECT User__c Id
            FROM UserToSoundboardGroup__c
            WHERE SoundboardGroup__c = :sendToId
            GROUP BY User__c
          ]
        )
        .keySet();
    } else {
      ids = new Set<Id>{ sendToId };
    }

    Database.SaveResult result = EventBus.publish(
      new PlayEvent__e(
        SoundUrl__c = soundUrl,
        Title__c = title,
        SendToIds__c = JSON.serialize(ids),
        IsAnonymous__c = isAnonymous,
        SenderName__c = UserInfo.getName()
      )
    );

    if (result.isSuccess()) {
      System.debug(LoggingLevel.INFO, 'Successfully published event.');
      return true;
    } else {
      for (Database.Error err : result.getErrors()) {
        System.debug(
          LoggingLevel.ERROR,
          'Error returned: ' +
          err.getStatusCode() +
          ' - ' +
          err.getMessage()
        );
      }
      return false;
    }
  }
}

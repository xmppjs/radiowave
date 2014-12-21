'use strict';

/**
 * @see http://xmpp.org/extensions/xep-0045.html#moderator
 */
describe('Xep-0060', function () {
  describe('8. Moderator Use Cases', function () {

    /*
     * Moderator Changes Subject
     * <message
     *     from='wiccarocks@shakespeare.lit/laptop'
     *     id='lh2bs617'
     *     to='coven@chat.shakespeare.lit'
     *     type='groupchat'>
     *   <subject>Fire Burn and Cauldron Bubble!</subject>
     * </message>
     *
     * Service Informs All Occupants of Subject Change
     * <message
     *     from='coven@chat.shakespeare.lit/secondwitch'
     *     id='5BCE07C5-0729-4353-A6A3-ED9818C9B498'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='groupchat'>
     *   <subject>Fire Burn and Cauldron Bubble!</subject>
     * </message>
     */
    it('8.1 Modifying the Room Subject', function (done) {
      done();
    });

    /*
     * <message
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='lh2bs617'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <subject>Fire Burn and Cauldron Bubble!</subject>
     *   <error by='coven@chat.shakespeare.lit' type='auth'>
     *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </message>
     */
    it('8.1  Returns Error Related to Unauthorized Subject Change', function (done) {
      done();
    });

    /*
     * <message
     *     from='wiccarocks@shakespeare.lit/laptop'
     *     id='uj3bs61g'
     *     to='coven@chat.shakespeare.lit'
     *     type='groupchat'>
     *   <subject></subject>
     * </message>
     */
    it('8.1 Moderator Sets Empty Subject', function (done) {
      done();
    });

    /*
     * Moderator Kicks Occupant
     * <iq from='fluellen@shakespeare.lit/pda'
     *     id='kick1'
     *     to='harfleur@chat.shakespeare.lit'
     *     type='set'>
     *   <query xmlns='http://jabber.org/protocol/muc#admin'>
     *     <item nick='pistol' role='none'>
     *       <reason>Avaunt, you cullion!</reason>
     *     </item>
     *   </query>
     * </iq>
     *
     * Service Removes Kicked Occupant
     * <presence
     *     from='harfleur@chat.shakespeare.lit/pistol'
     *     to='pistol@shakespeare.lit/harfleur'
     *     type='unavailable'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='none' role='none'>
     *       <actor nick='Fluellen'/>
     *       <reason>Avaunt, you cullion!</reason>
     *     </item>
     *     <status code='307'/>
     *   </x>
     * </presence>
     *
     * Service Informs Moderator of Success
     * <iq from='harfleur@chat.shakespeare.lit'
     *     id='kick1'
     *     to='fluellen@shakespeare.lit/pda'
     *     type='result'/>
     *
     * Service Informs Remaining Occupants
     * <presence
     *     from='harfleur@chat.shakespeare.lit/pistol'
     *     to='gower@shakespeare.lit/cell'
     *     type='unavailable'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='none' role='none'/>
     *     <status code='307'/>
     *   </x>
     * </presence>
     */
    it('8.2 Kicking an Occupant', function (done) {
      done();
    });

    /*
     * <iq from='coven@chat.shakespeare.lit'
     *     id='kicktest'
     *     to='wiccarocks@shakespeare.lit/laptop'
     *     type='error'>
     *   <error type='cancel'>
     *     <not-allowed xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </iq>
     */
    it('8.2 Kick User With Higher Affiliatio', function (done) {
      done();
    });

  });
});
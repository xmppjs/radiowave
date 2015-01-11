'use strict';

/**
 * @see XEP-0059: Result Set Management
 */
describe('Xep-0060', function () {
  describe('6.5 Retrieve Items from a Node', function () {

    /*
     * Requesting a Limit to the Result Set
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='limit1'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *     </set>
     *   </query>
     * </iq>
     *
     * Returning a Limited Result Set
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='limit1'>
     *   <query xmlns='jabber:iq:search'>
     *     <item jid='stpeter@jabber.org'>
     *       <first>Peter</first>
     *       <last>Saint-Andre</last>
     *       <nick>Pete</nick>
     *     </item>
     *     .
     *     [8 more items]
     *     .
     *     <item jid='peterpan@neverland.lit'>
     *       <first>Peter</first>
     *       <last>Pan</last>
     *       <nick>Pete</nick>
     *     </item>
     *   </query>
     */
    it('2.1 Limiting the Number of Items', function (done) {
      done();
    });

    /*
     * Requesting the First Page of a Result Set
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='page1'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *     </set>
     *   </query>
     * </iq>
     *
     * Returning the First Page of a Result Set
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='page1'>
     *   <query xmlns='jabber:iq:search'>
     *     <item jid='stpeter@jabber.org'>
     *       <first>Peter</first>
     *       <last>Saint-Andre</last>
     *       <nick>Pete</nick>
     *     </item>
     *     .
     *     [8 more items]
     *     .
     *     <item jid='peterpan@neverland.lit'>
     *       <first>Peter</first>
     *       <last>Pan</last>
     *       <nick>Pete</nick>
     *     </item>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <first index='0'>stpeter@jabber.org</first>
     *       <last>peterpan@neverland.lit</last>
     *       <count>800</count>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.2 Paging Forwards Through a Result Set(First Page)', function (done) {
      done();
    });

    /*
     * Requesting the Second Page of a Result Set
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='page2'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *       <after>peterpan@neverland.lit</after>
     *     </set>
     *   </query>
     * </iq>
     *
     * Returning the Second Page of a Result Set
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='page2'>
     *   <query xmlns='jabber:iq:search'>
     *     <item jid='peter@pixyland.org'>
     *       <first>Peter</first>
     *       <last>Pan</last>
     *       <nick>Pete</nick>
     *     </item>
     *     .
     *     [8 more items]
     *     .
     *     <item jid='peter@rabbit.lit'>
     *       <first>Peter</first>
     *       <last>Rabbit</last>
     *       <nick>Pete</nick>
     *     </item>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <first index='10'>peter@pixyland.org</first>
     *       <last>peter@rabbit.lit</last>
     *       <count>800</count>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.2 Paging Forwards Through a Result Set(Second Page)', function (done) {
      done();
    });

    /*
     * Returning an Empty Page
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='page80'>
     *   <query xmlns='jabber:iq:search'>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <count>790</count>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.2 Paging Forwards Through a Result Set(Empty Page)', function (done) {
      done();
    });


    /*
     * Requesting the Previous Page of a Result Set
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='back1'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *       <before>peter@pixyland.org</before>
     *     </set>
     *   </query>
     * </iq>
     *
     * Returning the Previous Page of a Result Set
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='back1'>
     *   <query xmlns='jabber:iq:search'>
     *     <item jid='stpeter@jabber.org'>
     *       <first>Peter</first>
     *       <last>Saint-Andre</last>
     *       <nick>Pete</nick>
     *     </item>
     *     .
     *     [8 more items]
     *     .
     *     <item jid='peterpan@neverland.lit'>
     *       <first>Peter</first>
     *       <last>Pan</last>
     *       <nick>Pete</nick>
     *     </item>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <first index='0'>stpeter@jabber.org</first>
     *       <last>peterpan@neverland.lit</last>
     *       <count>800</count>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.3 Paging Backwards Through a Result Set', function (done) {
      done();
    });

    /*
     * Returning a Page-Not-Found Error
     *
     * <iq type='error' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='page2'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *       <after>peterpan@neverland.lit</after>
     *     </set>
     *   </query>
     *   <error type='cancel'>
     *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </iq>
     */
    it('2.4 Page Not Found', function (done) {
      done();
    });


    /*
     * Requesting the Last Page of a Result Set
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='page1'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *       <before/>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.5 Requesting the Last Page in a Result Set', function (done) {
      done();
    });

    /*
     * Requesting a Result Page by Index
     *
     * <iq type='set' from='stpeter@jabber.org/roundabout' to='users.jabber.org' id='index10'>
     *   <query xmlns='jabber:iq:search'>
     *     <nick>Pete</nick>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <max>10</max>
     *       <index>371</index>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.6 Retrieving a Page Out of Order', function (done) {
      done();
    });

    /*
     * Returning a Result Page at an Index
     *
     * <iq type='result' from='users.jabber.org' to='stpeter@jabber.org/roundabout' id='index10'>
     *   <query xmlns='jabber:iq:search'>
     *     <item jid='peter@pixyland.org'>
     *       <first>Peter</first>
     *       <last>Pan</last>
     *       <nick>Pete</nick>
     *     </item>
     *     .
     *     [8 more items]
     *     .
     *     <item jid='peter@rabbit.lit'>
     *       <first>Peter</first>
     *       <last>Rabbit</last>
     *       <nick>Pete</nick>
     *     </item>
     *     <set xmlns='http://jabber.org/protocol/rsm'>
     *       <first index='371'>peter@pixyland.org</first>
     *       <last>peter@rabbit.lit</last>
     *       <count>800</count>
     *     </set>
     *   </query>
     * </iq>
     */
    it('2.7 Getting the Item Count', function (done) {
      done();
    });

  });
});
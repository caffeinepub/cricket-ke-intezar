import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  module TrendingItem {
    public func compare(a : TrendingItem, b : TrendingItem) : Order.Order {
      Nat.compare(b.trendingScore, a.trendingScore);
    };
  };

  type TrendingItem = {
    id : Nat;
    title : Text;
    description : Text;
    category : Text;
    views : Nat;
    likes : Nat;
    timestamp : Int;
    trendingScore : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  var nextItemId = 1;
  let items = Map.empty<Nat, TrendingItem>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  let initialData : [(Nat, TrendingItem)] = [
    (0, {
      id = 0;
      title = "Breaking News";
      description = "Major world event just happened!";
      category = "News";
      views = 1070;
      likes = 145;
      timestamp = Time.now();
      trendingScore = 2170;
    }),
    (
      1,
      {
        id = 1;
        title = "Movie Premiere";
        description = "Hot new blockbuster releasing this weekend";
        category = "Entertainment";
        views = 1020;
        likes = 160;
        timestamp = Time.now();
        trendingScore = 2060;
      },
    ),
    (
      2,
      {
        id = 2;
        title = "Tech Innovation";
        description = "Revolutionary gadget changing the industry";
        category = "Technology";
        views = 950;
        likes = 135;
        timestamp = Time.now();
        trendingScore = 1800;
      },
    ),
    (
      3,
      {
        id = 3;
        title = "Sports Highlights";
        description = "Unbelievable record broken in last night's game";
        category = "Sports";
        views = 670;
        likes = 70;
        timestamp = Time.now();
        trendingScore = 880;
      },
    ),
    (
      4,
      {
        id = 4;
        title = "Viral Challenge";
        description = "Everyone's doing this new internet craze!";
        category = "Social";
        views = 450;
        likes = 70;
        timestamp = Time.now();
        trendingScore = 660;
      },
    ),
    (
      5,
      {
        id = 5;
        title = "Breaking Update";
        description = "Developing story on a major news event";
        category = "News";
        views = 162;
        likes = 32;
        timestamp = Time.now();
        trendingScore = 258;
      },
    ),
    (
      6,
      {
        id = 6;
        title = "New Album Release";
        description = "Artist drops highly anticipated album";
        category = "Entertainment";
        views = 179;
        likes = 25;
        timestamp = Time.now();
        trendingScore = 254;
      },
    ),
    (
      7,
      {
        id = 7;
        title = "Fitness Craze";
        description = "Fitness challenge taking social media by storm";
        category = "Social";
        views = 180;
        likes = 7;
        timestamp = Time.now();
        trendingScore = 201;
      },
    ),
  ];

  for ((id, item) in initialData.values()) {
    items.add(id, item);
  };

  public shared ({ caller }) func addTrendingItem(title : Text, description : Text, category : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add trending items");
    };

    let id = nextItemId;
    nextItemId += 1;

    let newItem : TrendingItem = {
      id;
      title;
      description;
      category;
      views = 0;
      likes = 0;
      timestamp = Time.now();
      trendingScore = 0;
    };

    items.add(id, newItem);
    id;
  };

  func updateTrendingScore(item : TrendingItem) : Nat {
    let now = Time.now();
    let age = Int.abs(now - item.timestamp);
    var recencyBonus = 0;

    if (age < 24 * 60 * 60 * 1000000000) {
      recencyBonus := 1000;
    } else if (age < 7 * 24 * 60 * 60 * 1000000000) {
      recencyBonus := 500;
    } else if (age < 30 * 24 * 60 * 60 * 1000000000) {
      recencyBonus := 100;
    };

    item.likes * 3 + item.views + recencyBonus;
  };

  public query func getTrendingItems() : async [TrendingItem] {
    items.values().toArray().sort();
  };

  public query func getItemsByCategory(category : Text) : async [TrendingItem] {
    let filtered = items.values().toArray().filter(
      func(item) { if (category == "All") { true } else { Text.equal(item.category, category) } }
    );
    filtered.sort();
  };

  public shared ({ caller }) func likeItem(itemId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like items");
    };

    switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item not found") };
      case (?item) {
        let updatedItem : TrendingItem = {
          id = item.id;
          title = item.title;
          description = item.description;
          category = item.category;
          views = item.views;
          likes = item.likes + 1;
          timestamp = item.timestamp;
          trendingScore = updateTrendingScore({
            id = item.id;
            title = item.title;
            description = item.description;
            category = item.category;
            views = item.views;
            likes = item.likes + 1;
            timestamp = item.timestamp;
            trendingScore = item.trendingScore;
          });
        };
        items.add(itemId, updatedItem);
      };
    };
  };

  public shared ({ caller }) func incrementViews(itemId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can increment views");
    };

    switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item not found") };
      case (?item) {
        let updatedItem : TrendingItem = {
          id = item.id;
          title = item.title;
          description = item.description;
          category = item.category;
          views = item.views + 1;
          likes = item.likes;
          timestamp = item.timestamp;
          trendingScore = updateTrendingScore({
            id = item.id;
            title = item.title;
            description = item.description;
            category = item.category;
            views = item.views + 1;
            likes = item.likes;
            timestamp = item.timestamp;
            trendingScore = item.trendingScore;
          });
        };
        items.add(itemId, updatedItem);
      };
    };
  };

  public query func getTrendingItem(itemId : Nat) : async TrendingItem {
    switch (items.get(itemId)) {
      case (null) { Runtime.trap("Item not found") };
      case (?item) { item };
    };
  };

  public shared ({ caller }) func deleteTrendingItem(itemId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete trending items");
    };

    if (not items.containsKey(itemId)) {
      Runtime.trap("Item not found");
    };

    items.remove(itemId);
  };
};

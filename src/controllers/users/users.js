const Users = require("./../../models/users");
const Utils = require("./../../utils");

class UsersController {
  constructor() {}

  async search(req, res) {
    try {
      let input = req.body;
      input.search = input.search || "";
      input.page = input.page || 1;
      input.per_page = input.per_page || 10;

      let users_query = Users.query((qb) => {
        if (input.search) {
          qb.where("first_name", "LIKE", `%${input.search}%`);
          qb.orWhere("last_name", "LIKE", `%${input.search}%`);
          qb.orWhere("email", "LIKE", `%${input.search}%`);
        }
        qb.orderBy("id", "DESC");
      });
      let users = await users_query.fetchPage({
        columns: ["id", "first_name", "last_name", "email"], //เลือก colum ตาม db ของเราด้วย++++++++++
        page: input.page,
        pageSize: input.per_page,
      });

      users = users.toJSON();
      let count = await users_query.count();

      res.status(200).json({
        count: count,
        data: users,
      });
    } catch (err) {
      console.log(err.stack);
      res.status(400).json({
        message: err.message,
      });
    }
  }

  async showDB(req, res) {
    // Users.query(
    //     'SELECT id, first_name, last_name FROM users WHERE id=? ORDER BY id LIMIT 10 OFFSET ?',
    //     [Users, 10*(req.params.page || 0)],
    //     (error, results) => {
    //       if (error) {
    //         console.log(error);
    //         res.status(500).json({status: 'error'});
    //       } else {
    //         res.status(200).json(results);
    //       }
    //     }
    //   );
    
  }

  async createUser(req, res) {
    try {
      let input = req.body;
      input.email = input.email || "";
      input.name = input.name || "";

      if (!new Utils().validateEmail(input.email)) {
        throw new Error("Invalid email.");
      }

      if (!input.name) {
        throw new Error("Require name.");
      }

      if (!input.password) {
        throw new Error("Require password.");
      }

      let password = new Utils().encryptPassword(input.password);

      // check
      let user = await Users.where("email", input.email).fetch();
      if (user) {
        throw new Error("มีผู้ใช้งานนี้แล้ว.");
      }

      await new Users({
        email: input.email,
        name: input.name,
        password: password,
      }).save();

      res.status(200).json({
        message: "complete",
      });
    } catch (err) {
      console.log(err.stack);
      res.status(400).json({
        message: err.message,
      });
    }
  }

  async updateUser(req, res) {
    try {
      let input = req.body;
      let authen = req.authen;
      // console.log(authen.id, req.params.user_id)
      let user_id = req.params.user_id;
      if (authen.id != user_id) {
        throw new Error("ไม่มีสิทธิ์เข้าถึง.");
      }

      input.name = input.name || "";
      if (!input.name) {
        throw new Error("Require name.");
      }

      // check
      let user = await Users.where("id", user_id).fetch();
      if (!user) {
        throw new Error("ไม่มีผู้ใช้งานนี้.");
      }

      await user.save(
        {
          name: input.name,
        },
        { methods: "update", patch: true }
      );

      res.status(200).json({
        message: "complete",
      });
    } catch (err) {
      console.log(err.stack);
      res.status(400).json({
        message: err.message,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      let authen = req.authen;
      let user_id = req.params.user_id;
      if (authen.id != user_id) {
        throw new Error("ไม่มีสิทธิ์เข้าถึง.");
      }
      // check
      let user = await Users.where("id", user_id).fetch();
      if (!user) {
        throw new Error("ไม่มีผู้ใช้งานนี้.");
      }

      await user.destroy({ require: false });

      res.status(200).json({
        message: "complete",
      });
    } catch (err) {
      console.log(err.stack);
      res.status(400).json({
        message: err.message,
      });
    }
  }
}

module.exports = UsersController;

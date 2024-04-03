import { User } from '../model/User.js';
import jwt from 'jsonwebtoken';
import { sendMail } from '../middleware/sendMail.js';
import { v2 as cloudinary } from 'cloudinary';
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Please Enter the valid Email and Password',
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    return res
      .status(200)
      .cookie('token', token, {
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
        httpOnly: true,
      })
      .json({
        success: true,
        message: 'Logged In Success',
      });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: false,
        message: 'Logged Out Successfully',
      });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne().select('-password -email').limit(1);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const contact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const userMessage = `Hey, I am ${name}. My email is ${email}. My message is ${message}`;

    await sendMail(userMessage);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, password, skills, about } = req.body;
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    if (skills && Object.keys(skills).length > 0) {
      for (let i = 1; i <= 6; i++) {
        const imageKey = `image${i}`;

        if (skills[imageKey]) {
          await cloudinary.v2.uploader.destroy(user.skills[imageKey].public_id);
          const myCloud = await cloudinary.uploader.upload(skills[imageKey], {
            folder: 'portfolio',
          });

          user.skills[imageKey] = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }
    }
    if (about) {
      if (about.name) user.about.name = about.name;
      if (about.title) user.about.title = about.title;
      if (about.subtitle) user.about.subtitle = about.subtitle;
      if (about.description) user.about.description = about.description;
      if (about.quote) user.about.quote = about.quote;
      if (about.avatar) {
        await cloudinary.uploader.destroy(user.about.avatar.public_id);
        const myCloud = await cloudinary.uploader.upload(about.avatar, {
          folder: 'portfolio',
          transformation: [{ quality: 'auto' }],
        });

        user.about.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: 'User Updated successfully',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const addTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const user = await User.findById(req.user._id);
    user.timeline.unshift({
      title,
      description,
      date,
    });
    await user.save();
    res.status(200).json({
      success: true,
      message: 'New Timeline Added',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const addProject = async (req, res) => {
  try {
    const { title, url, image, description, techStack } = req.body;
    const user = await User.findById(req.user._id);

    const myCloud = await cloudinary.uploader.upload(image, {
      folder: 'portfolio',
      transformation: [{ quality: 'auto' }],
    });
    user.projects.unshift({
      url,
      title,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      description,
      techStack,
    });

    await user.save();
    res.status(200).json({
      success: true,
      message: 'New Project Added',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const addYoutube = async (req, res) => {
  try {
    const { title, url, image } = req.body;
    const user = await User.findById(req.user._id);

    const myCloud = await cloudinary.uploader.upload(image, {
      folder: 'portfolio',
      transformation: [
        { quality: '40' },
        { fetch_format: 'auto' },
        { width: 600, height: 600, crop: 'limit' },
        { flags: 'progressive' },
      ],
    });

    user.youtube.unshift({
      url,
      title,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'New Short Videos Added',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    user.timeline = user.timeline.filter((item) => item._id != id);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Timeline Deleted Successfully',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteYoutube = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const video = user.youtube.find(
      (video) => video._doc._id.toString() === id
    );

    await cloudinary.uploader.destroy(video._doc.image.public_id);
    user.youtube = user.youtube.filter(
      (video) => video._doc._id.toString() !== id
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Video Deleted Successfully',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    const project = user.projects.find((item) => item._id == id);

    await cloudinary.uploader.destroy(project.image.public_id);
    user.projects = user.projects.filter((project) => project._id != id);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Project Deleted Successfully',
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

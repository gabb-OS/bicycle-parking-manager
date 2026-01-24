package com.contextaware.app_bpm.ui.login

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.contextaware.app_bpm.R
import com.contextaware.app_bpm.databinding.FragmentLoginBinding

class LoginFragment : Fragment() {

    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val loginViewModel = ViewModelProvider(this).get(LoginViewModel::class.java)
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        val root: View = binding.root

        loginViewModel.statusMessage.observe(viewLifecycleOwner) { message ->
            binding.tvStatus.text = message
            if (message == "Login Successful" || message == "Registration Successful") {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.action_login_to_home)
            }
        }

        loginViewModel.user.observe(viewLifecycleOwner) { user ->
            if (user == null) {
                binding.tvStatus.text = "Logged out"
                binding.etEmail.setText("")
                binding.etPassword.setText("")
            } else {
                binding.tvStatus.text = "Logged in as: ${user.email}"
            }
        }

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val pass = binding.etPassword.text.toString()
            loginViewModel.login(email, pass)
        }

        binding.btnRegister.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val pass = binding.etPassword.text.toString()
            loginViewModel.register(email, pass)
        }

        binding.btnLogout.setOnClickListener {
            loginViewModel.logout()
        }

        return root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}